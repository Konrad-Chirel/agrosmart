<?php

namespace App\Services;

use App\Models\Arrosage;
use App\Models\BesoinHydrique;
use App\Models\DecisionArrosage;
use App\Models\Parcelle;
use Illuminate\Support\Facades\Log;

class MoteurArrosageService
{
    public function __construct(
        private MeteoService $meteoService,
        private NotificationService $notificationService,
        private PompeService $pompeService,
    ) {
    }

    /**
     * Analyse une parcelle et enregistre une decision d'arrosage tracable.
     */
    public function analyser(int $parcelle_id): ?DecisionArrosage
    {
        $parcelle = Parcelle::with(['user', 'cultureActive', 'lecturesCapteurs'])->find($parcelle_id);
        $lecture = $parcelle?->lecturesCapteurs()->latest('lu_le')->first();
        $culture = $parcelle?->cultureActive;

        if (! $parcelle || ! $lecture || ! $culture || $culture->type_culture === 'autre') {
            return null;
        }

        $derniereDecision = $parcelle->decisionsArrosage()->latest()->first();
        if ($derniereDecision && $derniereDecision->created_at >= $lecture->lu_le) {
            return $derniereDecision;
        }

        $semaine = max(1, intdiv($culture->date_semis->diffInDays(now()), 7) + 1);
        $besoin = BesoinHydrique::where('type_culture', $culture->type_culture)
            ->where('semaine_debut', '<=', $semaine)
            ->where('semaine_fin', '>=', $semaine)
            ->first();

        if (! $besoin) {
            return null;
        }

        $culture->update([
            'semaine_actuelle' => $semaine,
            'stade_actuel' => $besoin->stade,
        ]);

        $surface = (float) ($culture->superficie_m2 ?: $parcelle->superficie_m2);
        $besoinTotal = (float) $besoin->litres_par_m2_par_jour * $surface;
        $eauArrosages = Arrosage::where('parcelle_id', $parcelle->id)
            ->where('debut_arrosage', '>=', today())
            ->sum('volume_litres');

        $pluieDetectee = $this->pluieDetectee($parcelle);
        $eauPluie = $pluieDetectee || $this->meteoService->getPluiePrevue((float) $parcelle->latitude, (float) $parcelle->longitude)
            ? $besoinTotal * 0.5
            : 0;

        $coefficient = 1.0;
        if ((float) $lecture->luminosite > 80000) {
            $coefficient += 0.2;
        }
        if ((float) $lecture->vitesse_vent > 20) {
            $coefficient += 0.2;
        }

        $temperature = $this->meteoService->getTemperatureActuelle((float) $parcelle->latitude, (float) $parcelle->longitude);
        if ($temperature !== null && $temperature > 35) {
            $coefficient += 0.1;
        }

        $besoinAjuste = $besoinTotal * $coefficient;
        $eauRecue = (float) $eauArrosages + $eauPluie;
        $deficit = max(0, $besoinAjuste - $eauRecue);
        $humidite = (float) $lecture->humidite_sol;

        $decision = $this->decider(
            $parcelle,
            $culture->id,
            $humidite,
            $temperature,
            $besoinTotal,
            $besoinAjuste,
            $eauRecue,
            $deficit,
            $coefficient,
            $pluieDetectee,
        );

        Log::info('Decision arrosage AgroSmart', $decision->toArray());
        $this->notifier($decision, $parcelle, $derniereDecision, $humidite);

        if ($decision->type_decision === 'arrosage_urgent' && ! $this->pompeService->estActive($parcelle->id)) {
            try {
                $this->pompeService->demarrer(
                    $parcelle->id,
                    $this->dureePourVolume((float) $decision->volume_recommande_litres),
                    (float) $decision->volume_recommande_litres,
                );
                $decision->update(['executee' => true]);
            } catch (\Throwable $error) {
                Log::warning('Commande pompe MQTT non envoyee', [
                    'parcelle_id' => $parcelle->id,
                    'message' => $error->getMessage(),
                ]);
            }
        }

        return $decision;
    }

    private function decider(
        Parcelle $parcelle,
        int $cultureId,
        float $humidite,
        ?float $temperature,
        float $besoinTotal,
        float $besoinAjuste,
        float $eauRecue,
        float $deficit,
        float $coefficient,
        bool $pluieDetectee,
    ): DecisionArrosage {
        $type = 'arrosage_programme';
        $heure = '18:00';
        $volume = $deficit;
        $raison = 'Arrosage programme ce soir a 18h00';

        if ($humidite > 85) {
            $type = 'aucun_arrosage';
            $heure = null;
            $volume = 0;
            $raison = "Sol saturé d'eau (Risque d'asphyxie). Arrêt immédiat recommandé.";
        } elseif ($deficit <= 0 || $humidite >= 70) {
            $type = 'aucun_arrosage';
            $heure = null;
            $volume = 0;
            $raison = "Besoins couverts. Pas d'arrosage aujourd'hui.";
        } elseif ($humidite < 25 || $deficit > $besoinTotal * 0.8) {
            $type = 'arrosage_urgent';
            $heure = now()->format('H:i');
            $raison = 'Sol trop sec, arrosage immediat necessaire';
        } elseif ($this->meteoService->getChaleurPrevueDemain((float) $parcelle->latitude, (float) $parcelle->longitude) && $humidite < 60) {
            $type = 'arrosage_preventif';
            $heure = '06:00';
            $volume = $besoinAjuste;
            $raison = 'Chaleur prevue demain, arrosage preventif a 6h00';
        }

        return DecisionArrosage::create([
            'parcelle_id' => $parcelle->id,
            'culture_id' => $cultureId,
            'type_decision' => $type,
            'besoin_base_litres' => round($besoinTotal, 2),
            'eau_recue_litres' => round($eauRecue, 2),
            'volume_litres' => round($volume, 2),
            'volume_recommande_litres' => round($volume, 2),
            'heure_programmee' => $heure,
            'heure_recommandee' => $heure,
            'raison' => $raison,
            'deficit_calcule' => round($deficit, 2),
            'coefficient_evaporation' => $coefficient,
            'humidite_sol_au_moment' => $humidite,
            'temperature_au_moment' => $temperature,
            'pluie_detectee' => $pluieDetectee,
            'message_affiche' => $raison,
        ]);
    }

    private function pluieDetectee(Parcelle $parcelle): bool
    {
        $lectures = $parcelle->lecturesCapteurs()->where('lu_le', '>=', now()->subHour())->orderBy('lu_le')->get();
        if ($lectures->count() < 2) {
            return false;
        }

        return ((float) $lectures->last()->humidite_sol - (float) $lectures->first()->humidite_sol) > 20;
    }

    private function notifier(DecisionArrosage $decision, Parcelle $parcelle, ?DecisionArrosage $precedente, float $humidite): void
    {
        if ($precedente && $precedente->type_decision === $decision->type_decision) {
            return;
        }

        if ($decision->type_decision === 'aucun_arrosage' && str_contains($decision->raison, 'asphyxie')) {
            $this->notificationService->notifierSolSature($parcelle->user, $parcelle, $humidite);
            return; // on ne veut pas déclencher le notifierAucunArrosage normal juste après
        }

        if ($humidite < 25 && $decision->type_decision === 'arrosage_urgent') {
            $this->notificationService->notifierSolSec($parcelle->user, $parcelle);
        }

        if ($decision->type_decision === 'arrosage_urgent') {
            $this->notificationService->notifierArrosageUrgent($parcelle->user, $parcelle);
        } elseif ($decision->type_decision === 'arrosage_preventif') {
            $this->notificationService->notifierArrosagePreventif($parcelle->user, (string) $decision->heure_recommandee);
        } elseif ($decision->type_decision === 'aucun_arrosage') {
            $this->notificationService->notifierAucunArrosage($parcelle->user, $decision->raison);
        }
    }

    private function dureePourVolume(float $volume): int
    {
        return max(5, (int) ceil($volume / 20));
    }
}
