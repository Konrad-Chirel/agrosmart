<?php

namespace App\Jobs;

use App\Services\MoteurArrosageService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class AnalyserCapteursJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $parcelleId)
    {
    }

    /**
     * Lance l'analyse intelligente d'une parcelle.
     */
    public function handle(MoteurArrosageService $service): void
    {
        $service->analyser($this->parcelleId);
    }
}
