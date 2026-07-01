<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CultureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'parcelle_id' => $this->parcelle_id,
            'type_culture' => $this->type_culture,
            'date_semis' => $this->date_semis?->toDateString(),
            'date_fin_prevue' => $this->date_fin_prevue?->toDateString(),
            'statut' => $this->statut,
        ];
    }
}
