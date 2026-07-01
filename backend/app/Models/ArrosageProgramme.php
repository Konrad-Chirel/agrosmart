<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArrosageProgramme extends Model
{
    protected $table = 'arrosages_programmes';

    protected $fillable = [
        'culture_id',
        'parcelle_id',
        'user_id',
        'date_arrosage',
        'heure_arrosage',
        'duree_minutes',
        'volume_estime_litres',
        'statut',
        'volume_reel_litres',
        'duree_reelle_minutes',
        'commande_mqtt_envoyee',
        'programme_recalcule',
    ];

    protected function casts(): array
    {
        return [
            'date_arrosage' => 'date',
            'volume_estime_litres' => 'decimal:2',
            'volume_reel_litres' => 'decimal:2',
            'commande_mqtt_envoyee' => 'boolean',
            'programme_recalcule' => 'boolean',
        ];
    }

    public function culture(): BelongsTo
    {
        return $this->belongsTo(Culture::class);
    }

    public function parcelle(): BelongsTo
    {
        return $this->belongsTo(Parcelle::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
