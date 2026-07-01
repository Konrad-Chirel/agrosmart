<?php

namespace App\Jobs;

use App\Models\ArrosageProgramme;
use App\Models\DecisionArrosage;
use App\Models\LectureCapteur;
use App\Services\PompeService;
use Illuminate\Support\Facades\Log;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ExecuterArrosageProgrammeJob implements ShouldQueue
{
    use Queueable;

    /**
     * Declenche les arrosages programmes dans l'heure suivante.
     */
    public function handle(PompeService $pompeService): void
    {
        $decisions = DecisionArrosage::whereIn('type_decision', ['arrosage_programme', 'arrosage_preventif'])
            ->where('executee', false)
            ->whereNotNull('heure_programmee')
            ->whereDate('created_at', today())
            ->get()
            ->filter(function ($decision) {
                $heure = now()->setTimeFromTimeString((string) $decision->heure_programmee);
                // On declenche si c'est l'heure exacte (a la minute pres)
                return $heure->format('H:i') === now()->format('H:i');
            });

        foreach ($decisions as $decision) {
            // Vérifier l'humidité du sol AVANT d'arroser
            $lecture = LectureCapteur::where('parcelle_id', $decision->parcelle_id)
                ->latest('lu_le')
                ->first();

            $humidite = $lecture ? (float) $lecture->humidite_sol : null;

            // Si l'humidité est déjà suffisante (>= 60%), on annule intelligemment
            if ($humidite !== null && $humidite >= 60) {
                $decision->update([
                    'executee' => true,
                    'raison' => "Annulé automatiquement : humidité du sol déjà à {$humidite}% (seuil: 60%). Un arrosage récent couvre les besoins.",
                ]);
                Log::info("Arrosage {$decision->id} annulé intelligemment (humidité sol: {$humidite}%)");
                continue;
            }

            $pompeService->demarrer($decision->parcelle_id, max(5, (int) ceil((float) $decision->volume_litres / 20)), (float) $decision->volume_litres);
            $decision->update(['executee' => true]);
        }

        $manuels = ArrosageProgramme::where('statut', 'planifie')
            ->whereDate('date_arrosage', '<=', today())
            ->get()
            ->filter(function ($programme) {
                $heure = now()->setTimeFromTimeString((string) $programme->heure_arrosage);
                return $heure->format('H:i') === now()->format('H:i');
            });

        foreach ($manuels as $programme) {
            $programme->update([
                'statut' => 'en_cours',
                'commande_mqtt_envoyee' => true,
            ]);

            $pompeService->demarrer(
                $programme->parcelle_id,
                (int) $programme->duree_minutes,
                (float) $programme->volume_estime_litres,
                'programme',
                $programme->id,
            );
        }
    }
}
