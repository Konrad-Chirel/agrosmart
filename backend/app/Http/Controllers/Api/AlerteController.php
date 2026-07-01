<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alerte;
use App\Services\ApiResponseService;
use Illuminate\Http\Request;

class AlerteController extends Controller
{
    public function index(Request $request)
    {
        $parcelle = \App\Models\Parcelle::where('user_id', $request->user()->id)->first();
        $humidite = $parcelle ? $parcelle->lecturesCapteurs()->latest('lu_le')->first()?->humidite_sol : 50;

        $conseil = "L'arrosage matinal réduit l'évaporation de 30%.";
        if ($humidite !== null) {
            if ($humidite > 85) {
                $conseil = "Attention au surplus d'eau ! Grattez la surface de la terre pour l'aérer et faciliter l'évaporation naturelle.";
            } elseif ($humidite < 25) {
                $conseil = "En période de stress hydrique, privilégiez le goutte-à-goutte pour que l'eau pénètre sans ruisseler.";
            }
        }

        $alertes = Alerte::where('user_id', $request->user()->id)->latest()->paginate(30);

        return response()->json([
            'status' => 'success',
            'message' => 'Alertes recuperees',
            'data' => $alertes,
            'conseil_expert' => $conseil,
        ]);
    }

    public function marquerLue(Request $request, int $id)
    {
        Alerte::where('user_id', $request->user()->id)->findOrFail($id)->update(['lue' => true]);

        return ApiResponseService::success('Alerte marquee comme lue');
    }
}
