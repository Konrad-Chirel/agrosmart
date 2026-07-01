<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DecisionArrosage extends Model
{
    protected $table = 'decisions_arrosage';

    protected $fillable = [
        'parcelle_id',
        'culture_id',
        'type_decision',
        'besoin_base_litres',
        'eau_recue_litres',
        'volume_litres',
        'volume_recommande_litres',
        'heure_programmee',
        'heure_recommandee',
        'raison',
        'deficit_calcule',
        'coefficient_evaporation',
        'humidite_sol_au_moment',
        'temperature_au_moment',
        'pluie_detectee',
        'message_affiche',
        'executee',
    ];

    protected function casts(): array
    {
        return [
            'besoin_base_litres' => 'decimal:2',
            'eau_recue_litres' => 'decimal:2',
            'volume_litres' => 'decimal:2',
            'volume_recommande_litres' => 'decimal:2',
            'deficit_calcule' => 'decimal:2',
            'coefficient_evaporation' => 'decimal:2',
            'humidite_sol_au_moment' => 'decimal:2',
            'temperature_au_moment' => 'decimal:2',
            'pluie_detectee' => 'boolean',
            'executee' => 'boolean',
        ];
    }

    public function parcelle(): BelongsTo
    {
        return $this->belongsTo(Parcelle::class);
    }

    public function culture(): BelongsTo
    {
        return $this->belongsTo(Culture::class);
    }
}
