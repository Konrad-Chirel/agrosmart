<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProgrammeArrosage extends Model
{
    protected $table = 'programmes_arrosage';

    protected $fillable = [
        'culture_id',
        'parcelle_id',
        'semaine_numero',
        'stade',
        'litres_par_m2',
        'volume_journalier_litres',
        'volume_ajuste_litres',
        'frequence_par_jour',
        'heure_recommandee',
        'date_debut_semaine',
        'date_fin_semaine',
        'eau_pluie_deduite',
        'recalcule_apres_pluie',
        'recalcule_apres_arrosage',
    ];

    protected function casts(): array
    {
        return [
            'litres_par_m2' => 'decimal:2',
            'volume_journalier_litres' => 'decimal:2',
            'volume_ajuste_litres' => 'decimal:2',
            'eau_pluie_deduite' => 'decimal:2',
            'date_debut_semaine' => 'date',
            'date_fin_semaine' => 'date',
            'recalcule_apres_pluie' => 'boolean',
            'recalcule_apres_arrosage' => 'boolean',
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
}
