<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Jobs\AnalyserCapteursJob;
use App\Jobs\ExecuterArrosageProgrammeJob;
use App\Models\Parcelle;
use App\Services\MeteoService;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(function () {
    Parcelle::query()->pluck('id')->each(fn ($id) => AnalyserCapteursJob::dispatch($id));
})->everyFiveMinutes();

Schedule::job(new ExecuterArrosageProgrammeJob())->everyMinute();

Schedule::call(function (MeteoService $meteoService) {
    Parcelle::query()->get(['latitude', 'longitude'])->each(function ($parcelle) use ($meteoService) {
        $meteoService->refresh((float) $parcelle->latitude, (float) $parcelle->longitude);
    });
})->everyThirtyMinutes();

Schedule::command('arrosage:verifier-programmes')->everyMinute();
