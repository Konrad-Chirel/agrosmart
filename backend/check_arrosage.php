<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$active = \App\Models\Arrosage::whereNull('fin_arrosage')->get();
echo "Active Arrosages: " . count($active) . "\n";
foreach ($active as $a) {
    echo "ID: " . $a->id . "\n";
    // Forcibly clear it to unlock the user
    $a->fin_arrosage = now();
    $a->save();
    echo "Cleared ID: " . $a->id . "\n";
}
