<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ParcelleRequest;
use App\Http\Resources\ParcelleResource;
use App\Models\Parcelle;
use App\Services\ApiResponseService;
use Illuminate\Http\Request;

class ParcelleController extends Controller
{
    public function index(Request $request)
    {
        return ApiResponseService::success('Parcelles recuperees', ParcelleResource::collection($request->user()->parcelles));
    }

    public function store(ParcelleRequest $request)
    {
        $parcelle = $request->user()->parcelles()->create($request->validated());

        return ApiResponseService::success('Parcelle creee', new ParcelleResource($parcelle), 201);
    }

    public function show(Request $request, int $id)
    {
        $parcelle = $request->user()->parcelles()->findOrFail($id);

        return ApiResponseService::success('Parcelle recuperee', new ParcelleResource($parcelle));
    }

    public function destroy(Request $request, int $id)
    {
        $request->user()->parcelles()->findOrFail($id)->delete();

        return ApiResponseService::success('Parcelle supprimee');
    }
}
