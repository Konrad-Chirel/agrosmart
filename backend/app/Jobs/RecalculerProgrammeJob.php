<?php

namespace App\Jobs;

use App\Models\Culture;
use App\Models\Parcelle;
use App\Services\ProgrammeArrosageService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class RecalculerProgrammeJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $cultureId, public int $parcelleId, public float $volumePluie)
    {
    }

    /**
     * Recalcule un programme apres detection d'une pluie.
     */
    public function handle(ProgrammeArrosageService $service): void
    {
        $culture = Culture::find($this->cultureId);
        $parcelle = Parcelle::find($this->parcelleId);

        if ($culture && $parcelle) {
            $service->recalculerApresPluie($culture, $parcelle, $this->volumePluie);
        }
    }
}
