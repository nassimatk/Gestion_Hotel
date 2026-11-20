<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tarif extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tarifs';

    protected $fillable = [
        'chambre_id',
        'saison_id',
        'prix_nuit',
        'devise',
        'statut',
    ];

    protected function casts(): array
    {
        return [
            'chambre_id' => 'integer',
            'saison_id' => 'integer',
            'prix_nuit' => 'float',
        ];
    }

    public function saison(): BelongsTo
    {
        return $this->belongsTo(Saison::class, 'saison_id');
    }
}