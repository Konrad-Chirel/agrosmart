<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BesoinHydrique extends Model
{
    protected $table = 'besoins_hydriques';

    protected $fillable = [
        'type_culture',
        'stade',
        'semaine_debut',
        'semaine_fin',
        'litres_par_m2_par_jour',
        'description_stade',
        'source_scientifique',
        'duree_cycle_semaines',
    ];

    protected function casts(): array
    {
        return [
            'litres_par_m2_par_jour' => 'decimal:2',
        ];
    }
}
