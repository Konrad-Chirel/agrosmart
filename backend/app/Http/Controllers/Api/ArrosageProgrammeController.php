<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ArrosageProgramme;
use App\Models\Culture;
use App\Services\ApiResponseService;
use Illuminate\Http\Request;

class ArrosageProgrammeController extends Controller
{
    public function index(Request $request)
    {
        $programmes = ArrosageProgramme::with(['culture', 'parcelle'])
            ->where('user_id', $request->user()->id)
            ->whereIn('statut', ['planifie', 'en_cours'])
            ->orderBy('date_arrosage')
            ->orderBy('heure_arrosage')
            ->get();

        return ApiResponseService::success('Arrosages programmes recuperes', [
            'arrosages_programmes' => $programmes,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'culture_id' => ['required', 'exists:cultures,id'],
            'date_arrosage' => ['required', 'date', 'after_or_equal:today'],
            'heure_arrosage' => ['required', 'date_format:H:i'],
            'duree_minutes' => ['required', 'integer', 'min:1', 'max:180'],
            'volume_estime_litres' => ['required', 'numeric', 'min:1'],
        ]);

        $culture = Culture::with('parcelle')
            ->where('user_id', $request->user()->id)
            ->findOrFail($data['culture_id']);

        $programme = ArrosageProgramme::create([
            'culture_id' => $culture->id,
            'parcelle_id' => $culture->parcelle_id,
            'user_id' => $request->user()->id,
            'date_arrosage' => $data['date_arrosage'],
            'heure_arrosage' => $data['heure_arrosage'],
            'duree_minutes' => $data['duree_minutes'],
            'volume_estime_litres' => $data['volume_estime_litres'],
            'statut' => 'planifie',
        ]);

        return ApiResponseService::success('Arrosage programme', [
            'arrosage_programme' => $programme,
            'avertissement' => $this->isHotHour($data['heure_arrosage'])
                ? 'Il fait souvent chaud entre 12h et 15h. Arrosez tot le matin si possible.'
                : null,
        ], 201);
    }

    public function annuler(Request $request, int $id)
    {
        $programme = ArrosageProgramme::where('user_id', $request->user()->id)->findOrFail($id);
        $programme->update(['statut' => 'annule']);

        return ApiResponseService::success('Arrosage annule', [
            'arrosage_programme' => $programme,
        ]);
    }

    private function isHotHour(string $heure): bool
    {
        $hour = (int) substr($heure, 0, 2);

        return $hour >= 12 && $hour <= 15;
    }
}
