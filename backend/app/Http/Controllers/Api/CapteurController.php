<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ApiResponseService;
use Illuminate\Http\Request;

class CapteurController extends Controller
{
    public function index(Request $request, int $id)
    {
        $periode = in_array((int) $request->query('periode', 7), [7, 30], true) ? (int) $request->query('periode', 7) : 7;
        $parcelle = $request->user()->parcelles()->findOrFail($id);
        $derniereLecture = $parcelle->lecturesCapteurs()->latest('lu_le')->first();

        if (! $derniereLecture) {
            return ApiResponseService::success('Capteur non connecté — en attente du prototype', [
                'derniere_lecture' => null,
                'capteurs' => [
                    'humidite_sol' => $this->capteurEnAttente('Humidité du sol'),
                    'temperature' => $this->capteurEnAttente('Température'),
                    'luminosite' => $this->capteurEnAttente('Luminosité'),
                    'vitesse_vent' => $this->capteurEnAttente('Vent'),
                ],
                'historique' => [],
            ]);
        }

        $historique = $parcelle->lecturesCapteurs()
            ->where('lu_le', '>=', now()->subDays($periode))
            ->latest('lu_le')
            ->paginate(100);

        return ApiResponseService::success('Capteur connecté — dernière mesure il y a '.$derniereLecture->lu_le->diffInMinutes(now()).' minutes', [
            'derniere_lecture' => $derniereLecture,
            'capteurs' => [
                'humidite_sol' => $this->capteurConnecte('Humidité du sol', $derniereLecture->humidite_sol, '%', $derniereLecture->lu_le),
                'temperature' => $this->capteurConnecte('Température', $derniereLecture->temperature, '°C', $derniereLecture->lu_le),
                'luminosite' => $this->capteurConnecte('Luminosité', $derniereLecture->luminosite, 'lux', $derniereLecture->lu_le),
                'vitesse_vent' => $this->capteurConnecte('Vent', $derniereLecture->vitesse_vent, 'km/h', $derniereLecture->lu_le),
            ],
            'historique' => $historique,
        ]);
    }

    private function capteurEnAttente(string $nom): array
    {
        return [
            'nom' => $nom,
            'valeur' => null,
            'unite' => null,
            'statut' => 'en_attente_connexion',
            'message' => 'Capteur non connecté — en attente du prototype',
        ];
    }

    private function capteurConnecte(string $nom, mixed $valeur, string $unite, mixed $luLe): array
    {
        $minutes = $luLe ? max(0, (int) $luLe->diffInMinutes(now())) : null;

        return [
            'nom' => $nom,
            'valeur' => $valeur === null ? null : (float) $valeur,
            'unite' => $unite,
            'statut' => 'connecte',
            'message' => $minutes === null
                ? 'Capteur connecté'
                : "Capteur connecté — dernière mesure il y a {$minutes} minutes",
        ];
    }
}
