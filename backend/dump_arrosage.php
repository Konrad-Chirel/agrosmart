<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$pompe = new App\Services\PompeService();
$pompe->demarrer(7, null, null);
$a = App\Models\Arrosage::whereNull('fin_arrosage')->first();
echo $a->toJson(JSON_PRETTY_PRINT) . PHP_EOL;
$controller = new App\Http\Controllers\Api\PompeController();
$request = new Illuminate\Http\Request();
$request->setUserResolver(function () { return App\Models\User::first(); });
$response = $controller->statut($request, 7, $pompe);
echo json_encode($response->getData(), JSON_PRETTY_PRINT) . PHP_EOL;

// Clean up
$pompe->arreter(7);
