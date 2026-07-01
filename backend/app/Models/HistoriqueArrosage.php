<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistoriqueArrosage extends Model
{
    protected $table = 'historique_arrosages';

    public $timestamps = false;

    protected $fillable = [
        'parcelle_id',
        'culture_id',
        'arrosage_programme_id',
        'decision_id',
        'type_declenchement',
        'volume_litres',
        'duree_minutes',
        'debut_arrosage',
        'fin_arrosage',
        'commande_mqtt_on',
        'commande_mqtt_off',
        'programme_recalcule_apres',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'volume_litres' => 'decimal:2',
            'debut_arrosage' => 'datetime',
            'fin_arrosage' => 'datetime',
            'commande_mqtt_on' => 'datetime',
            'commande_mqtt_off' => 'datetime',
            'programme_recalcule_apres' => 'boolean',
            'created_at' => 'datetime',
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
