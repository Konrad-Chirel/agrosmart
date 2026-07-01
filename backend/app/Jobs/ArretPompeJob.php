<?php

namespace App\Jobs;

use App\Models\Parcelle;
use App\Services\NotificationService;
use App\Services\PompeService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ArretPompeJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $parcelleId)
    {
    }

    /**
     * Arrete automatiquement la pompe apres la duree prevue.
     */
    public function handle(PompeService $pompeService, NotificationService $notificationService): void
    {
        $arrosage = $pompeService->arreter($this->parcelleId);

        if (! $arrosage) {
            return;
        }

        $parcelle = Parcelle::with('user')->find($this->parcelleId);

        if ($parcelle?->user) {
            $notificationService->notifierArrosageEffectue($parcelle->user, (float) $arrosage->volume_litres);
        }
    }
}
