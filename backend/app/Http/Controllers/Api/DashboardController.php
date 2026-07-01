<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BesoinHydrique;
use App\Services\ApiResponseService;
use App\Services\MeteoService;
use App\Services\MoteurArrosageService;
use App\Services\PompeService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function show(Request $request, int $id, MeteoService $meteoService, PompeService $pompeService, MoteurArrosageService $moteurArrosageService)
    {
        $parcelle = $request->user()->parcelles()->with('cultureActive')->findOrFail($id);
        $lecture = $parcelle->lecturesCapteurs()->latest('lu_le')->first();
        $culture = $parcelle->cultureActive;
        $decision = $moteurArrosageService->analyser($parcelle->id) ?: $parcelle->decisionsArrosage()->latest()->first();
        $semaine = $culture ? max(1, intdiv($culture->date_semis->diffInDays(now()), 7) + 1) : null;
        $besoin = $culture && $culture->type_culture !== 'autre'
            ? BesoinHydrique::where('type_culture', $culture->type_culture)->where('semaine_debut', '<=', $semaine)->where('semaine_fin', '>=', $semaine)->first()
            : null;

        $vent_api = null;
        if ($lecture && $lecture->vitesse_vent == 0) {
            $meteo = $meteoService->getPrevisionsActuelles((float) ($parcelle->latitude ?? 9.35), (float) ($parcelle->longitude ?? 2.63));
            if ($meteo['available'] && !empty($meteo['list'][0]['wind']['speed'])) {
                $vent_api = round($meteo['list'][0]['wind']['speed'] * 3.6);
            }
        }

        return ApiResponseService::success('Dashboard recupere', [
            'parcelle' => ['id' => $parcelle->id, 'nom' => $parcelle->nom_parcelle, 'superficie_m2' => (float) $parcelle->superficie_m2],
            'culture' => $culture ? [
                'id' => $culture->id,
                'type' => $culture->type_culture,
                'stade_actuel' => $besoin?->stade,
                'semaine_actuelle' => $semaine,
                'besoin_eau_aujourd_hui_litres' => $besoin ? (float) $besoin->litres_par_m2_par_jour * (float) $parcelle->superficie_m2 : null,
                'source_agronomique' => $besoin?->source_scientifique,
            ] : null,
            'capteurs' => $lecture ? [
                'id' => $lecture->id,
                'humidite_sol' => $lecture->humidite_sol === null ? null : (float) $lecture->humidite_sol,
                'temperature' => $lecture->temperature === null ? null : (float) $lecture->temperature,
                'vitesse_vent' => $vent_api !== null ? (float) $vent_api : ($lecture->vitesse_vent === null ? null : (float) $lecture->vitesse_vent),
                'luminosite' => $lecture->luminosite === null ? null : (float) $lecture->luminosite,
                'source' => $lecture->source,
                'lu_le' => $lecture->lu_le,
                'statut' => $lecture->source === 'simulation' ? 'simulation' : 'connecte',
                'message' => $lecture->source === 'simulation'
                    ? 'Mode simulation - sondes non connectees'
                    : 'Systeme operationnel - donnees en direct',
            ] : [
                'humidite_sol' => null,
                'temperature' => null,
                'vitesse_vent' => null,
                'luminosite' => null,
                'source' => null,
                'lu_le' => null,
                'statut' => 'non_connecte',
                'message' => 'Sondes non connectees - en attente du prototype',
            ],
            'decision' => $decision ?: [
                'type_decision' => 'aucun_arrosage',
                'volume_litres' => 0,
                'heure_programmee' => null,
                'raison' => 'Sondes non connectees - en attente du prototype',
                'deficit_calcule' => 0,
                'coefficient_evaporation' => 1,
                'pluie_detectee' => false,
                'executee' => false,
            ],
            'meteo' => [
                'source' => 'openweathermap',
                'temperature' => $meteoService->getTemperatureActuelle((float) $parcelle->latitude, (float) $parcelle->longitude),
                'pluie_prevue_demain' => $meteoService->getPluiePrevue((float) $parcelle->latitude, (float) $parcelle->longitude),
                'chaleur_prevue_demain' => $meteoService->getChaleurPrevueDemain((float) $parcelle->latitude, (float) $parcelle->longitude),
                'vent_prevu_kmh' => $meteoService->getVentPrevu((float) $parcelle->latitude, (float) $parcelle->longitude),
            ],
            'reservoir' => [
                'niveau' => $pompeService->estimerNiveauReservoir($parcelle),
                'source' => $parcelle->niveau_reservoir !== null ? 'capteur' : 'estime',
            ],
            'statut_pompe' => $pompeService->estActive($parcelle->id) ? 'active' : 'inactive',
            'alertes_recentes' => $parcelle->alertes()->where('lue', false)->latest()->limit(3)->get(),
            'prochain_arrosage' => $decision?->heure_programmee,
        ]);
    }
}
