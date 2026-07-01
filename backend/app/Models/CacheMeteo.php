<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CacheMeteo extends Model
{
    protected $table = 'cache_meteo';

    public $timestamps = false;

    protected $fillable = [
        'parcelle_id',
        'temperature',
        'humidite_air',
        'vitesse_vent',
        'description',
        'icone',
        'pluie_prevue_demain',
        'chaleur_prevue_demain',
        'coefficient_evaporation',
        'previsions_48h',
        'valide_jusqu_a',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'temperature' => 'decimal:2',
            'humidite_air' => 'decimal:2',
            'vitesse_vent' => 'decimal:2',
            'coefficient_evaporation' => 'decimal:2',
            'pluie_prevue_demain' => 'boolean',
            'chaleur_prevue_demain' => 'boolean',
            'previsions_48h' => 'array',
            'valide_jusqu_a' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function parcelle(): BelongsTo
    {
        return $this->belongsTo(Parcelle::class);
    }
}
