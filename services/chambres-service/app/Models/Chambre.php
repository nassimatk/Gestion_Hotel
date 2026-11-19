<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Modèle Chambre
 *
 * Représente une chambre d'hôtel dans le schéma 'chambres'.
 * Soft Delete activé : deleted_at rempli à la suppression, jamais de DELETE physique.
 */
class Chambre extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'chambres';

    /**
     * Attributs assignables en masse (Mass Assignment Protection).
     */
    protected $fillable = [
        'nom',
        'numero',
        'type',
        'capacite',
        'prix_nuit',
        'description',
        'superficie',
        'etage',
        'vue',
        'equipements',
        'images',
        'statut',
    ];

    /**
     * Casts : conversion automatique des types.
     */
    protected $casts = [
        'capacite'    => 'integer',
        'prix_nuit'   => 'float',
        'superficie'  => 'float',
        'etage'       => 'integer',
        'equipements' => 'array',
        'images'      => 'array',
        'created_at'  => 'datetime',
        'updated_at'  => 'datetime',
        'deleted_at'  => 'datetime',
    ];
}
