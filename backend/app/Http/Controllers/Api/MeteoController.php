<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CacheMeteo;
use App\Services\ApiResponseService;
use App\Services\MeteoService;
use Illuminate\Http\Request;

class MeteoController extends Controller
{
    public function index(Request $request, int $parcelle_id, MeteoService $meteoService)
    {
        $parcelle = $request->user()->parcelles()->findOrFail($parcelle_id);
        $lat = (float) $parcelle->latitude;
        $lon = (float) $parcelle->longitude;

        $meteo = $meteoService->getPrevisionsMobiles($lat, $lon);
        $current = $meteo['current'] ?? [];

        CacheMeteo::create([
            'parcelle_id' => $parcelle->id,
            'temperature' => $current['temperature'] ?? 0,
            'humidite_air' => $current['humidity'] ?? 0,
            'vitesse_vent' => $current['wind_kmh'] ?? 0,
            'description' => $current['description'] ?? 'Indisponible',
            'icone' => $current['icon'] ?? '01d',
            'pluie_prevue_demain' => $meteoService->getPluiePrevue($lat, $lon),
            'chaleur_prevue_demain' => $meteoService->getChaleurPrevueDemain($lat, $lon),
            'coefficient_evaporation' => $meteoService->calculerCoefficientMeteo($lat, $lon),
            'previsions_48h' => $meteo['hourly_48h'] ?? [],
            'valide_jusqu_a' => now()->addMinutes(30),
            'created_at' => now(),
        ]);

        return ApiResponseService::success('Meteo actualisee', [
            'meteo' => $meteo,
            'impact_arrosage' => [
                'temperature' => $meteoService->getTemperatureActuelle($lat, $lon),
                'pluie_prevue' => $meteoService->getPluiePrevue($lat, $lon),
                'chaleur_prevue_demain' => $meteoService->getChaleurPrevueDemain($lat, $lon),
                'vent_prevu_kmh' => $meteoService->getVentPrevu($lat, $lon),
                'coefficient_meteo' => $meteoService->calculerCoefficientMeteo($lat, $lon),
            ],
        ]);
    }
}
