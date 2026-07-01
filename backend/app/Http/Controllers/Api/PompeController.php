<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PompeArreterRequest;
use App\Http\Requests\PompeDemarrerRequest;
use App\Models\HistoriqueArrosage;
use App\Services\ApiResponseService;
use App\Services\PompeService;
use Illuminate\Http\Request;

class PompeController extends Controller
{
    public function verifierConditions(Request $request, int $parcelle_id, \App\Services\MeteoService $meteoService)
    {
        $parcelle = $request->user()->parcelles()->findOrFail($parcelle_id);
        $lecture = $parcelle->lecturesCapteurs()->latest('lu_le')->first();

        if ($lecture && (float) $lecture->humidite_sol > 70) {
            return ApiResponseService::success('Avertissement', [
                'status' => 'warning',
                'message' => "Le sol est déjà très humide ({$lecture->humidite_sol}%). Un arrosage supplémentaire risque de noyer les racines et de favoriser les maladies. Êtes-vous sûr de vouloir forcer l'arrosage ?"
            ]);
        }

        if ($meteoService->getPluiePrevue((float) $parcelle->latitude, (float) $parcelle->longitude)) {
            return ApiResponseService::success('Avertissement', [
                'status' => 'warning',
                'message' => "Des précipitations sont prévues dans les prochaines heures. Il est recommandé de laisser la pluie faire le travail pour économiser l'eau. Êtes-vous sûr de vouloir arroser maintenant ?"
            ]);
        }

        return ApiResponseService::success('Conditions optimales', ['status' => 'ok']);
    }

    public function programmer(\App\Http\Requests\PompeProgrammerRequest $request)
    {
        $parcelle = $request->user()->parcelles()->findOrFail($request->parcelle_id);
        $culture = $parcelle->cultures()->where('statut', 'active')->first();

        \App\Models\DecisionArrosage::create([
            'parcelle_id' => $parcelle->id,
            'culture_id' => $culture?->id,
            'type_decision' => 'arrosage_programme',
            'volume_litres' => (float) ($request->volume_litres ?? $request->duree_minutes * 20),
            'heure_programmee' => $request->heure_programmee,
            'executee' => false,
            'raison' => 'Programmation manuelle via l\'application',
            'besoin_base_litres' => 0,
            'volume_recommande_litres' => (float) ($request->volume_litres ?? $request->duree_minutes * 20),
            'heure_recommandee' => \Carbon\Carbon::parse($request->heure_programmee)->format('H:i'),
        ]);

        return ApiResponseService::success('Arrosage programmé avec succès');
    }

    public function programmationActive(Request $request, int $parcelle_id)
    {
        $parcelle = $request->user()->parcelles()->findOrFail($parcelle_id);
        
        $decision = \App\Models\DecisionArrosage::where('parcelle_id', $parcelle->id)
            ->where('type_decision', 'arrosage_programme')
            ->where('raison', 'Programmation manuelle via l\'application')
            ->where('executee', false)
            ->latest()
            ->first();

        // Si la décision est dans le passé, on la marque comme expirée/ignorée
        if ($decision && \Carbon\Carbon::parse($decision->heure_programmee)->isPast()) {
            $decision->update(['executee' => true, 'raison' => 'Expiré (non exécuté)']);
            $decision = null;
        }

        return ApiResponseService::success('Programmation active', ['decision' => $decision]);
    }

    public function annulerProgrammation(Request $request, int $parcelle_id)
    {
        $parcelle = $request->user()->parcelles()->findOrFail($parcelle_id);
        
        \App\Models\DecisionArrosage::where('parcelle_id', $parcelle->id)
            ->where('type_decision', 'arrosage_programme')
            ->where('raison', 'Programmation manuelle via l\'application')
            ->where('executee', false)
            ->delete();

        return ApiResponseService::success('Programmation annulée avec succès');
    }

    public function demarrer(PompeDemarrerRequest $request, PompeService $pompeService)
    {
        if ($pompeService->estActive($request->parcelle_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Un arrosage est déjà en cours sur cette parcelle.'
            ], 400);
        }

        $duree = $request->duree_minutes;
        $volume = $request->volume_litres;
        
        if ($volume === null && $duree !== null) {
            $volume = $duree * 20;
        }

        $pompeService->demarrer(
            $request->parcelle_id,
            $duree,
            $volume,
            'manuel',
        );

        return ApiResponseService::success('Arrosage démarré');
    }

    public function arreter(PompeArreterRequest $request, PompeService $pompeService)
    {
        $pompeService->arreter($request->parcelle_id);

        return ApiResponseService::success('Arrosage arrêté');
    }

    public function statut(Request $request, int $parcelle_id, PompeService $pompeService)
    {
        $request->user()->parcelles()->findOrFail($parcelle_id);

        $arrosage = \App\Models\Arrosage::where('parcelle_id', $parcelle_id)
            ->whereNull('fin_arrosage')
            ->latest('debut_arrosage')
            ->first();

        if ($arrosage && $arrosage->debut_arrosage) {
            $arrosage->duree_ecoulee_secondes = (int) abs(now()->diffInSeconds($arrosage->debut_arrosage));
        }

        return ApiResponseService::success('Statut pompe recupere', [
            'active' => $pompeService->estActive($parcelle_id),
            'arrosage' => $arrosage,
        ]);
    }

    public function historique(Request $request, int $parcelle_id)
    {
        $request->user()->parcelles()->findOrFail($parcelle_id);

        $query = HistoriqueArrosage::where('parcelle_id', $parcelle_id)
            ->whereNotNull('fin_arrosage')
            ->orderByDesc('debut_arrosage');

        if ($request->has('filtre')) {
            $filtre = $request->filtre;
            if ($filtre === 'semaine') {
                $query->where('debut_arrosage', '>=', now()->startOfWeek());
            } elseif ($filtre === 'mois') {
                $query->where('debut_arrosage', '>=', now()->startOfMonth());
            }
        }

        $historique = $query->paginate(20);

        return ApiResponseService::success('Historique recupere', $historique);
    }
}
