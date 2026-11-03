<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Avis extends Model
{
    use HasFactory;

    protected $table = 'avis';

    protected $fillable = [
        'user_id',
        'chambre_id',
        'note',
        'commentaire',
    ];

    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'chambre_id' => 'integer',
            'note' => 'integer',
        ];
    }
}