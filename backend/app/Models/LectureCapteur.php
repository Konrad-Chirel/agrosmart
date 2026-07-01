<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LectureCapteur extends Model
{
    protected $table = 'lectures_capteurs';

    protected $fillable = ['parcelle_id', 'humidite_sol', 'temperature', 'vitesse_vent', 'luminosite', 'source', 'statut', 'lu_le'];

    protected function casts(): array
    {
        return [
            'humidite_sol' => 'decimal:2',
            'temperature' => 'decimal:2',
            'vitesse_vent' => 'decimal:2',
            'luminosite' => 'decimal:2',
            'lu_le' => 'datetime',
        ];
    }

    public function parcelle(): BelongsTo
    {
        return $this->belongsTo(Parcelle::class);
    }
}
