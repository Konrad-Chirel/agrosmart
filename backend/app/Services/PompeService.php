<?php

namespace App\Services;

use App\Jobs\ArretPompeJob;
use App\Models\ArrosageProgramme;
use App\Models\Arrosage;
use App\Models\HistoriqueArrosage;
use App\Models\Parcelle;
use Illuminate\Support\Facades\Log;
use PhpMqtt\Client\Facades\MQTT;

class PompeService
{
    /**
     * Demarre la pompe via MQTT et planifie son arret.
     */
    public function demarrer(int $parcelle_id, ?float $duree_minutes, ?float $volume_litres, string $declenche_par = 'automatique', ?int $arrosageProgrammeId = null): void
    {
        if ($this->estActive($parcelle_id)) {
            return;
        }

        try {
            $topic_id = \Illuminate\Support\Facades\Cache::get("esp32_topic_for_parcelle_{$parcelle_id}", "1");
            $connection = MQTT::connection();
            $connection->publish("agrosmart/pompes/{$topic_id}", json_encode([
                'action' => 'demarrer_pompe',
                'duree_minutes' => $duree_minutes,
            ]), 1); // QoS 1 pour garantir la livraison
            usleep(300000); // 300ms de pause pour s'assurer que le paquet quitte le serveur
            $connection->disconnect();
        } catch (\Throwable $error) {
            Log::warning('Commande pompe ON enregistree sans MQTT', [
                'parcelle_id' => $parcelle_id,
                'message' => $error->getMessage(),
            ]);
        }

        $arrosage = Arrosage::create([
            'parcelle_id' => $parcelle_id,
            'decision_id' => null,
            'volume_litres' => $volume_litres,
            'duree_minutes' => $duree_minutes,
            'declenche_par' => $declenche_par,
            'debut_arrosage' => now(),
        ]);

        $parcelle = Parcelle::with('cultureActive')->find($parcelle_id);
        if ($parcelle?->cultureActive) {
            HistoriqueArrosage::create([
                'parcelle_id' => $parcelle_id,
                'culture_id' => $parcelle->cultureActive->id,
                'arrosage_programme_id' => $arrosageProgrammeId,
                'decision_id' => $arrosage->decision_id,
                'type_declenchement' => $declenche_par,
                'volume_litres' => $volume_litres,
                'duree_minutes' => $duree_minutes,
                'debut_arrosage' => $arrosage->debut_arrosage,
                'commande_mqtt_on' => now(),
                'created_at' => now(),
            ]);
        }

        if ($duree_minutes !== null) {
            ArretPompeJob::dispatch($parcelle_id)->delay(now()->addSeconds(round($duree_minutes * 60)));
        }
    }

    /**
     * Arrete la pompe via MQTT et cloture l'arrosage actif.
     */
    public function arreter(int $parcelle_id): ?Arrosage
    {
        try {
            $topic_id = \Illuminate\Support\Facades\Cache::get("esp32_topic_for_parcelle_{$parcelle_id}", "1");
            $connection = MQTT::connection();
            $connection->publish("agrosmart/pompes/{$topic_id}", json_encode([
                'action' => 'arreter_pompe',
            ]), 1); // QoS 1
            usleep(300000); // 300ms
            $connection->disconnect();
        } catch (\Throwable $error) {
            Log::warning('Commande pompe OFF enregistree sans MQTT', [
                'parcelle_id' => $parcelle_id,
                'message' => $error->getMessage(),
            ]);
        }

        $arrosage = Arrosage::where('parcelle_id', $parcelle_id)
            ->whereNull('fin_arrosage')
            ->first();

        if ($arrosage) {
            $fin = now();
            $duree_secondes = $arrosage->debut_arrosage->diffInSeconds($fin);
            $duree_minutes = $arrosage->duree_minutes ?? ($duree_secondes / 60);
            
            // Si le volume n'était pas défini, on le calcule avec le débit configuré (par défaut 80 L/min)
            $debitLMin = config('agrosmart.debit_pompe_l_min', 80);
            $volume = $arrosage->volume_litres ?? ($duree_minutes * $debitLMin);

            $arrosage->update([
                'fin_arrosage' => $fin,
                'duree_minutes' => $duree_minutes,
                'volume_litres' => $volume,
            ]);

            $historiques = HistoriqueArrosage::where('parcelle_id', $parcelle_id)
                ->whereNull('fin_arrosage')
                ->get();

            foreach ($historiques as $historique) {
                $historique->update([
                    'fin_arrosage' => $fin,
                    'commande_mqtt_off' => $fin,
                    'volume_litres' => $volume,
                    'duree_minutes' => $duree_minutes,
                ]);

                if ($historique->arrosage_programme_id) {
                    \App\Models\ArrosageProgramme::where('id', $historique->arrosage_programme_id)->update([
                        'statut' => 'effectue',
                        'volume_reel_litres' => $volume,
                        'duree_reelle_minutes' => $duree_minutes,
                    ]);
                }
            }
        }

        return $arrosage;
    }

    public function estActive(int $parcelle_id): bool
    {
        return Arrosage::where('parcelle_id', $parcelle_id)->whereNull('fin_arrosage')->exists();
    }

    public function estimerNiveauReservoir(Parcelle $parcelle): float
    {
        if ($parcelle->niveau_reservoir !== null) {
            return (float) $parcelle->niveau_reservoir;
        }

        $capacite = max(1, config('agrosmart.reservoir_capacite_litres', 1000));
        $consomme = Arrosage::where('parcelle_id', $parcelle->id)
            ->where('debut_arrosage', '>=', today())
            ->sum('volume_litres');

        return max(0, round((($capacite - (float) $consomme) / $capacite) * 100, 1));
    }
}
