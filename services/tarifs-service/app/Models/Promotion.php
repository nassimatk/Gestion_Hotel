<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Promotion extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'promotions';

    protected $fillable = [
        'libelle',
        'chambre_id',
        'type_reduction',
        'valeur',
        'nuits_min',
        'date_debut',
        'date_fin',
        'statut',
    ];

    protected function casts(): array
    {
        return [
            'chambre_id' => 'integer',
            'valeur' => 'float',
            'nuits_min' => 'integer',
            'date_debut' => 'date:Y-m-d',
            'date_fin' => 'date:Y-m-d',
        ];
    }
}