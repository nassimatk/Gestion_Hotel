<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Saison extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'saisons';

    protected $fillable = [
        'nom',
        'coefficient',
        'date_debut',
        'date_fin',
    ];

    protected function casts(): array
    {
        return [
            'coefficient' => 'float',
            'date_debut'  => 'date:Y-m-d',
            'date_fin'    => 'date:Y-m-d',
        ];
    }
}