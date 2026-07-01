<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LectureCapteur;
use App\Services\ApiResponseService;
use App\Services\MoteurArrosageService;
use Illuminate\Http\Request;

class ConnexionCapteurController extends Controller
{
    /**
     * Retourne l'etat de detection des sondes de la parcelle.
     */
    public function statut(Request $request, int $id)
    {
        $parcelle = $request->user()->parcelles()->findOrFail($id);
        $lecture = $parcelle->lecturesCapteurs()->latest('lu_le')->first();

        if ($lecture && $lecture->source === 'esp32') {
            return ApiResponseService::success('Vos sondes sont connectées', [
                'statut' => 'connecte',
                'source' => 'esp32',
                'capteurs' => $this->capteurs('connecte'),
                'peut_continuer' => true,
            ]);
        }

        if ($lecture && $lecture->source === 'simulation') {
            return ApiResponseService::success('Mode simulation actif', [
                'statut' => 'simulation',
                'source' => 'simulation',
                'capteurs' => $this->capteurs('simulation'),
                'peut_continuer' => true,
            ]);
        }

        return ApiResponseService::success('Vos sondes ne sont pas détectées', [
            'statut' => 'non_connecte',
            'source' => null,
            'capteurs' => $this->capteurs('non_connecte'),
            'peut_continuer' => false,
        ]);
    }

    /**
     * Genere une lecture realiste pour tester l'application sans prototype.
     */
    public function simulation(Request $request, int $id, MoteurArrosageService $moteurArrosageService)
    {
        $parcelle = $request->user()->parcelles()->findOrFail($id);

        $lecture = LectureCapteur::create([
            'parcelle_id' => $parcelle->id,
            'humidite_sol' => random_int(3000, 7000) / 100,
            'temperature' => random_int(2500, 3800) / 100,
            'luminosite' => random_int(40000, 90000),
            'vitesse_vent' => random_int(500, 2500) / 100,
            'source' => 'simulation',
            'lu_le' => now(),
        ]);

        $decision = $moteurArrosageService->analyser($parcelle->id);

        return ApiResponseService::success('Mode simulation activé', [
            'statut' => 'simulation',
            'source' => 'simulation',
            'lecture' => [
                'id' => $lecture->id,
                'humidite_sol' => (float) $lecture->humidite_sol,
                'temperature' => (float) $lecture->temperature,
                'luminosite' => (float) $lecture->luminosite,
                'vitesse_vent' => (float) $lecture->vitesse_vent,
                'source' => $lecture->source,
                'lu_le' => $lecture->lu_le,
            ],
            'decision' => $decision,
            'capteurs' => $this->capteurs('simulation'),
            'peut_continuer' => true,
        ], 201);
    }

    private function capteurs(string $statut): array
    {
        $labels = [
            'humidite_sol' => 'Eau dans la terre',
            'temperature' => 'Température',
            'luminosite' => 'Soleil',
            'vitesse_vent' => 'Vent',
        ];

        return collect($labels)->map(fn (string $label) => [
            'nom' => $label,
            'statut' => $statut,
        ])->all();
    }
}
