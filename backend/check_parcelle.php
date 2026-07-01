<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$parcelle = \App\Models\Parcelle::with('culture')->first();
echo json_encode($parcelle, JSON_PRETTY_PRINT) . "\n";
