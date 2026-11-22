<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tarif extends Model
{
    use HasFactory;

    protected $table = 'tarifs';

    protected $fillable = [
        'chambre_id',
        'numero_chambre',
        'saison_id',
        'coefficient_saison',
        'promotion_id',
        'promotion_pourcent',
        'prix_base',
        'prix_nuit',
        'devise',
        'statut',
    ];

    protected $casts = [
        'prix_base' => 'float',
        'prix_nuit' => 'float',
        'coefficient_saison' => 'float',
        'promotion_pourcent' => 'float',
    ];

    public function saison()
    {
        return $this->belongsTo(Saison::class, 'saison_id');
    }

    public function promotion()
    {
        return $this->belongsTo(Promotion::class, 'promotion_id');
    }
}