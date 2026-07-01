<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BesoinHydrique;
use App\Services\ApiResponseService;

class AgronomieController extends Controller
{
    public function cultures()
    {
        $cultures = BesoinHydrique::selectRaw('type_culture, max(semaine_fin) as cycle_semaines')
            ->groupBy('type_culture')
            ->orderBy('type_culture')
            ->get();

        return ApiResponseService::success('Cultures agronomiques recuperees', $cultures);
    }

    public function stades(string $culture)
    {
        return ApiResponseService::success('Stades agronomiques recuperes', BesoinHydrique::where('type_culture', $culture)->orderBy('semaine_debut')->get());
    }
}
