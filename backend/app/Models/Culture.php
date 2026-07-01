<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Culture extends Model
{
    protected $fillable = [
        'parcelle_id',
        'user_id',
        'type_culture',
        'date_semis',
        'date_fin_prevue',
        'superficie_m2',
        'statut',
        'semaine_actuelle',
        'stade_actuel',
    ];

    protected function casts(): array
    {
        return [
            'date_semis' => 'date',
            'date_fin_prevue' => 'date',
        ];
    }

    public function parcelle(): BelongsTo
    {
        return $this->belongsTo(Parcelle::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function decisionsArrosage(): HasMany
    {
        return $this->hasMany(DecisionArrosage::class);
    }

    public function programmesArrosage(): HasMany
    {
        return $this->hasMany(ProgrammeArrosage::class);
    }
}
