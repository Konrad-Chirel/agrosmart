<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Arrosage extends Model
{
    protected $fillable = [
        'parcelle_id',
        'decision_id',
        'volume_litres',
        'duree_minutes',
        'declenche_par',
        'debut_arrosage',
        'fin_arrosage',
    ];

    protected function casts(): array
    {
        return [
            'volume_litres' => 'decimal:2',
            'debut_arrosage' => 'datetime',
            'fin_arrosage' => 'datetime',
        ];
    }

    public function parcelle(): BelongsTo
    {
        return $this->belongsTo(Parcelle::class);
    }

    public function decision(): BelongsTo
    {
        return $this->belongsTo(DecisionArrosage::class, 'decision_id');
    }
}
