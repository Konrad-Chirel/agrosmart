<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Latest History: " . json_encode(\App\Models\HistoriqueArrosage::latest('id')->first()) . "\n";
