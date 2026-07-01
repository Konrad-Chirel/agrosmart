<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Alerte extends Model
{
    protected $fillable = [
        'parcelle_id',
        'user_id',
        'type_alerte',
        'niveau',
        'titre',
        'message',
        'action_disponible',
        'lue',
        'acquittee',
        'notification_envoyee',
    ];

    protected function casts(): array
    {
        return [
            'lue' => 'boolean',
            'acquittee' => 'boolean',
            'notification_envoyee' => 'boolean',
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
}
