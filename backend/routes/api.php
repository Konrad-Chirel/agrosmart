<?php

use App\Http\Controllers\Api\AgronomieController;
use App\Http\Controllers\Api\AlerteController;
use App\Http\Controllers\Api\ArrosageProgrammeController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CapteurController;
use App\Http\Controllers\Api\ConnexionCapteurController;
use App\Http\Controllers\Api\CultureController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MeteoController;
use App\Http\Controllers\Api\ParcelleController;
use App\Http\Controllers\Api\PompeController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/profile', [AuthController::class, 'getProfile']);
        Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        Route::get('/parcelles', [ParcelleController::class, 'index']);
        Route::post('/parcelles', [ParcelleController::class, 'store']);
        Route::get('/parcelles/{id}', [ParcelleController::class, 'show']);
        Route::delete('/parcelles/{id}', [ParcelleController::class, 'destroy']);

        Route::get('/cultures', [CultureController::class, 'index']);
        Route::post('/cultures', [CultureController::class, 'store']);
        Route::get('/cultures/{id}', [CultureController::class, 'show']);
        Route::get('/cultures/{id}/programme', [CultureController::class, 'programme']);

        Route::get('/arrosages-programmes', [ArrosageProgrammeController::class, 'index']);
        Route::post('/arrosages-programmes', [ArrosageProgrammeController::class, 'store']);
        Route::patch('/arrosages-programmes/{id}/annuler', [ArrosageProgrammeController::class, 'annuler']);

        Route::get('/parcelles/{id}/dashboard', [DashboardController::class, 'show']);
        Route::get('/parcelles/{id}/capteurs', [CapteurController::class, 'index']);
        Route::get('/parcelles/{id}/capteurs/statut', [ConnexionCapteurController::class, 'statut']);
        Route::post('/parcelles/{id}/capteurs/simulation', [ConnexionCapteurController::class, 'simulation']);

        Route::post('/parcelles/{parcelle_id}/pompe/verifier', [PompeController::class, 'verifierConditions']);
        Route::post('/parcelles/{parcelle_id}/pompe/programmer', [PompeController::class, 'programmer']);
        Route::get('/parcelles/{parcelle_id}/pompe/programmation-active', [PompeController::class, 'programmationActive']);
        Route::post('/parcelles/{parcelle_id}/pompe/annuler-programmation', [PompeController::class, 'annulerProgrammation']);
        Route::post('/parcelles/{parcelle_id}/pompe/demarrer', [PompeController::class, 'demarrer']);
        Route::post('/parcelles/{parcelle_id}/pompe/arreter', [PompeController::class, 'arreter']);
        Route::get('/parcelles/{parcelle_id}/pompe/statut', [PompeController::class, 'statut']);
        Route::get('/parcelles/{parcelle_id}/historique-arrosages', [PompeController::class, 'historique']);

        Route::get('/alertes', [AlerteController::class, 'index']);
        Route::patch('/alertes/{id}/lue', [AlerteController::class, 'marquerLue']);

        Route::get('/meteo/{parcelle_id}', [MeteoController::class, 'index']);
        Route::get('/agronomie/cultures', [AgronomieController::class, 'cultures']);
        Route::get('/agronomie/{culture}/stades', [AgronomieController::class, 'stades']);
    });
});
