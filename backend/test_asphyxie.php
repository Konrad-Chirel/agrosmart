<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$parcelle = \App\Models\Parcelle::first();
if ($parcelle) {
    $parcelle->lecturesCapteurs()->create([
        'humidite_sol' => 95,
        'temperature' => 25,
        'luminosite' => 50000,
        'vitesse_vent' => 10,
        'lu_le' => now()
    ]);
    
    $res = app(\App\Services\MoteurArrosageService::class)->analyser($parcelle->id);
    print_r($res->toArray());
} else {
    echo "Pas de parcelle.\n";
}
