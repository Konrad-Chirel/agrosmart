<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$pompeService = app(\App\Services\PompeService::class);
echo "Publishing demarrer...\n";
$pompeService->demarrer(1, null, null, 'manuel');
echo "Published.\n";
