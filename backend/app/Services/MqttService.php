<?php

namespace App\Services;

use App\Jobs\AnalyserCapteursJob;
use App\Jobs\RecalculerProgrammeJob;
use App\Models\LectureCapteur;
use App\Models\Parcelle;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use PhpMqtt\Client\Facades\MQTT;

class MqttService
{
    public function __construct(
        private NotificationService $notificationService,
        private PompeService $pompeService,
    ) {
    }

    /**
     * Ecoute les donnees de l'ESP32 sur le topic champ/capteurs.
     */
    public function ecouterCapteurs(): void
    {
        /** @var \PhpMqtt\Client\MqttClient $mqtt */
        $mqtt = MQTT::connection();
        $mqtt->subscribe('agrosmart/sensors/+', function (string $topic, string $message) {
            $this->traiterMessageCapteurs($topic, $message);
        });
        $mqtt->loop(true);
    }

    /**
     * Decode le JSON ESP32, sauvegarde la lecture et lance l'analyse.
     */
    public function traiterMessageCapteurs(string $topic, string $message): ?LectureCapteur
    {
        // Extract parcelle_id from topic e.g. agrosmart/sensors/5
        $parts = explode('/', $topic);
        $parcelle_id = end($parts);

        $payload = json_decode($message, true);
        if (! is_array($payload) || ! isset($payload['humidite'], $payload['vent'], $payload['luminosite'])) {
            Log::warning('Payload MQTT capteurs invalide', ['message' => $message, 'topic' => $topic]);

            return null;
        }

        // HACK PROTOTYPE: On associe toujours les donnees recues a la derniere parcelle creee par l'utilisateur
        // pour eviter de devoir reflasher l'ESP32 a chaque nouveau test/compte.
        $parcelle = Parcelle::with('user')->latest('id')->first();
        if (! $parcelle) {
            Log::warning('Aucune parcelle existante pour recevoir les donnees MQTT', ['topic_id' => $parcelle_id]);
            return null;
        }

        // On memorise l'ID utilise par l'ESP32 pour que le PompeService puisse lui repondre sur le bon canal
        \Illuminate\Support\Facades\Cache::put("esp32_topic_for_parcelle_{$parcelle->id}", $parcelle_id, now()->addDays(30));

        // ── Filtre anti-interférence ──────────────────────────────────────
        // Quand le relais de la pompe commute (ON→OFF ou OFF→ON), il crée
        // un pic électromagnétique qui fausse les lectures du capteur
        // capacitif d'humidité pendant quelques secondes.
        // On ignore les mesures reçues dans les 5s suivant un changement.
        $pumpStateKey = "pump_state_changed_at_{$parcelle->id}";
        $lastPumpChange = Cache::get($pumpStateKey);
        if ($lastPumpChange && now()->diffInSeconds($lastPumpChange) < 5) {
            echo "⏳ [".now()->format('H:i:s')."] Lecture ignorée (stabilisation relais en cours)\n";
            return null;
        }

        $lecturePrecedente = $parcelle->lecturesCapteurs()->latest('lu_le')->first();
        $avant = $parcelle->lecturesCapteurs()->where('lu_le', '>=', now()->subHour())->oldest('lu_le')->first();

        $lecture = LectureCapteur::create([
            'parcelle_id' => $parcelle->id,
            'humidite_sol' => $payload['humidite'],
            'temperature' => $payload['temperature'] ?? null,
            'vitesse_vent' => $payload['vent'],
            'luminosite' => $payload['luminosite'],
            'source' => 'esp32',
            'lu_le' => now(),
        ]);
        
        echo "✅ [".now()->format('H:i:s')."] Mesures reçues de l'ESP32 : Humidité: {$payload['humidite']}%, Temp: {$payload['temperature']}°C, Lum: {$payload['luminosite']}%\n";

        if (array_key_exists('niveau_reservoir', $payload)) {
            $niveau = max(0, min(100, (float) $payload['niveau_reservoir']));
            $parcelle->update(['niveau_reservoir' => $niveau]);

            if ($niveau <= config('agrosmart.reservoir_seuil_alerte_pct', 15)) {
                $this->notificationService->notifierReservoirVide($parcelle->user, $parcelle, $niveau);
            }
        }

        $this->detecterFuite($parcelle, $lecture, $lecturePrecedente);

        if ($avant && ((float) $lecture->humidite_sol - (float) $avant->humidite_sol) > 20) {
            $culture = $parcelle->cultureActive;
            if ($culture) {
                RecalculerProgrammeJob::dispatch($culture->id, $parcelle->id, 100);
            }
        }

        AnalyserCapteursJob::dispatch($parcelle->id);

        return $lecture;
    }

    private function detecterFuite(Parcelle $parcelle, LectureCapteur $lecture, ?LectureCapteur $precedente): void
    {
        if (! $precedente || ! $this->pompeService->estActive($parcelle->id)) {
            return;
        }

        $minutes = $precedente->lu_le->diffInMinutes($lecture->lu_le);
        $chute = (float) $precedente->humidite_sol - (float) $lecture->humidite_sol;

        if ($minutes <= 10 && $chute >= 15) {
            $this->notificationService->notifierFuiteDetectee($parcelle->user, $parcelle);
        }
    }
}
