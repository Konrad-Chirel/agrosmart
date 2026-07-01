<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Parcelle extends Model
{
    protected $fillable = ['user_id', 'nom_parcelle', 'superficie_m2', 'latitude', 'longitude', 'niveau_reservoir'];

    protected function casts(): array
    {
        return [
            'superficie_m2' => 'decimal:2',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'niveau_reservoir' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function cultures(): HasMany
    {
        return $this->hasMany(Culture::class);
    }

    public function cultureActive()
    {
        return $this->hasOne(Culture::class)->where('statut', 'active')->latestOfMany();
    }

    public function lecturesCapteurs(): HasMany
    {
        return $this->hasMany(LectureCapteur::class);
    }

    public function decisionsArrosage(): HasMany
    {
        return $this->hasMany(DecisionArrosage::class);
    }

    public function arrosages(): HasMany
    {
        return $this->hasMany(Arrosage::class);
    }

    public function historiquesArrosage(): HasMany
    {
        return $this->hasMany(HistoriqueArrosage::class);
    }

    public function cacheMeteo(): HasMany
    {
        return $this->hasMany(CacheMeteo::class);
    }

    public function alertes(): HasMany
    {
        return $this->hasMany(Alerte::class);
    }
}
