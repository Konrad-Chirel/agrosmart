<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParcelleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom_parcelle,
            'superficie_m2' => (float) $this->superficie_m2,
            'latitude' => (float) $this->latitude,
            'longitude' => (float) $this->longitude,
        ];
    }
}
