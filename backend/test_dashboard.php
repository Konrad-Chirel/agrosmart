<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$request = \Illuminate\Http\Request::create('/api/parcelles/7/dashboard', 'GET');
$user = \App\Models\User::first();
$request->setUserResolver(function () use ($user) {
    return $user;
});

$controller = app(\App\Http\Controllers\Api\DashboardController::class);
$response = $controller->show($request, 7, app(\App\Services\MeteoService::class), app(\App\Services\PompeService::class), app(\App\Services\MoteurArrosageService::class));

echo $response->getContent() . "\n";
