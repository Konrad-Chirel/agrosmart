<?php

namespace App\Services;

use App\Models\BesoinHydrique;
use App\Models\Culture;
use App\Models\Parcelle;
use App\Models\ProgrammeArrosage;
use Carbon\Carbon;

class ProgrammeArrosageService
{
    /**
     * Genere le programme hebdomadaire complet d'une culture.
     */
    public function generer(Culture $culture, Parcelle $parcelle): array
    {
        ProgrammeArrosage::where('culture_id', $culture->id)->delete();

        $besoins = BesoinHydrique::where('type_culture', $culture->type_culture)
            ->orderBy('semaine_debut')
            ->get();

        foreach ($besoins as $besoin) {
            for ($semaine = $besoin->semaine_debut; $semaine <= $besoin->semaine_fin; $semaine++) {
                $volumeJournalier = (float) $besoin->litres_par_m2_par_jour * (float) ($culture->superficie_m2 ?: $parcelle->superficie_m2);
                $frequence = $this->frequencePour((float) $besoin->litres_par_m2_par_jour);

                ProgrammeArrosage::create([
                    'culture_id' => $culture->id,
                    'parcelle_id' => $parcelle->id,
                    'semaine_numero' => $semaine,
                    'stade' => $besoin->stade,
                    'litres_par_m2' => (float) $besoin->litres_par_m2_par_jour,
                    'volume_journalier_litres' => $volumeJournalier,
                    'volume_ajuste_litres' => $volumeJournalier,
                    'frequence_par_jour' => $frequence,
                    'heure_recommandee' => $frequence >= 2 ? '06:30' : '18:00',
                    'date_debut_semaine' => $culture->date_semis->copy()->addWeeks($semaine - 1),
                    'date_fin_semaine' => $culture->date_semis->copy()->addWeeks($semaine)->subDay(),
                ]);
            }
        }

        return ProgrammeArrosage::where('culture_id', $culture->id)->orderBy('semaine_numero')->get()->toArray();
    }

    /**
     * Recalcule les volumes restants apres une pluie detectee.
     */
    public function recalculerApresPluie(Culture $culture, Parcelle $parcelle, float $volumePluie): void
    {
        $restants = ProgrammeArrosage::where('culture_id', $culture->id)
            ->whereDate('date_fin_semaine', '>=', today())
            ->orderBy('semaine_numero')
            ->get();

        foreach ($restants as $programme) {
            $nouveauVolume = max(0, (float) $programme->volume_journalier_litres - $volumePluie);
            $programme->update([
                'volume_journalier_litres' => $nouveauVolume,
                'volume_ajuste_litres' => $nouveauVolume,
                'eau_pluie_deduite' => min((float) $programme->volume_journalier_litres, $volumePluie),
                'recalcule_apres_pluie' => true,
            ]);
            $volumePluie = max(0, $volumePluie - (float) $programme->volume_journalier_litres);
        }
    }

    /**
     * Recalcule le programme restant apres un arrosage manuel ou programme.
     */
    public function recalculerApresArrosage(Culture $culture, Parcelle $parcelle, float $volumeArrosage): void
    {
        $programme = ProgrammeArrosage::where('culture_id', $culture->id)
            ->whereDate('date_debut_semaine', '<=', Carbon::today())
            ->whereDate('date_fin_semaine', '>=', Carbon::today())
            ->first();

        if (! $programme) {
            return;
        }

        $nouveauVolume = max(0, (float) $programme->volume_ajuste_litres - $volumeArrosage);
        $programme->update([
            'volume_ajuste_litres' => $nouveauVolume,
            'recalcule_apres_arrosage' => true,
        ]);
    }

    private function frequencePour(float $litres): int
    {
        return $litres >= 5 ? 2 : 1;
    }
}
