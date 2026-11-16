<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Saison extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'saisons';

    protected $fillable = [
        'nom',
        'date_debut',
        'date_fin',
    ];

    protected function casts(): array
    {
        return [
            'date_debut' => 'date:Y-m-d',
            'date_fin' => 'date:Y-m-d',
        ];
    }

    public function tarifs(): HasMany
    {
        return $this->hasMany(Tarif::class, 'saison_id');
    }
}