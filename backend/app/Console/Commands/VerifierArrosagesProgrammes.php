<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\DecisionArrosage;
use App\Models\Alerte;
use App\Services\MeteoService;
use App\Services\PompeService;
use Carbon\Carbon;

class VerifierArrosagesProgrammes extends Command
{
    protected $signature = 'arrosage:verifier-programmes';
    protected $description = 'Verifie et execute les arrosages programmes manuellement';

    public function handle(MeteoService $meteoService, PompeService $pompeService)
    {
        $now = now();

        // 1. Verification Meteo a H-15
        $decisionsAVerifier = DecisionArrosage::with('parcelle')
            ->whereIn('type_decision', ['arrosage_programme'])
            ->where('executee', false)
            ->whereBetween('heure_programmee', [$now->copy()->addMinutes(14), $now->copy()->addMinutes(15)])
            ->get();

        foreach ($decisionsAVerifier as $decision) {
            $parcelle = $decision->parcelle;
            if ($parcelle && $meteoService->getPluiePrevue((float) $parcelle->latitude, (float) $parcelle->longitude)) {
                Alerte::create([
                    'parcelle_id' => $parcelle->id,
                    'user_id' => $parcelle->user_id,
                    'titre' => 'Alerte météo : Arrosage suspendu',
                    'message' => "Votre arrosage programmé à " . Carbon::parse($decision->heure_programmee)->format('H:i') . " a été suspendu car de la pluie est annoncée. Voulez-vous arroser quand même ?",
                    'type_alerte' => 'meteo',
                    'niveau' => 'warning',
                    'action_disponible' => true,
                ]);

                $decision->update(['executee' => true, 'raison' => 'Annulé suite prévision pluie (demande autorisation)']);
                $this->info("Arrosage {$decision->id} suspendu (pluie).");
            }
        }

        // 2. Execution a l'heure H des decisions non annulees
        $decisionsAExecuter = DecisionArrosage::with('parcelle')
            ->whereIn('type_decision', ['programme_manuel', 'arrosage_programme'])
            ->where('executee', false)
            ->where(function ($query) use ($now) {
                // Comparer uniquement l'heure (HH:MM) indépendamment de la date
                $query->whereRaw("TIME(heure_programmee) <= ?", [$now->format('H:i:s')]);
            })
            ->whereDate('created_at', today())
            ->get();

        foreach ($decisionsAExecuter as $decision) {
            $parcelle = $decision->parcelle;
            if ($parcelle) {
                $pompeService->demarrer(
                    $parcelle->id,
                    max(1, (int) ($decision->volume_litres / 20)),
                    $decision->volume_litres,
                    'manuel'
                );
                $decision->update(['executee' => true, 'raison' => 'Exécuté avec succès']);
                $this->info("Arrosage {$decision->id} execute.");
            }
        }
    }
}
