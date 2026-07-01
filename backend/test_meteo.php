<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$meteoService = app(\App\Services\MeteoService::class);
$meteo = $meteoService->getPrevisionsActuelles(9.35, 2.63);
echo json_encode($meteo, JSON_PRETTY_PRINT) . "\n";
