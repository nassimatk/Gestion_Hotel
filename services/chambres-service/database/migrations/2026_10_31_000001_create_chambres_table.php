<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crée la table 'chambres' dans le schéma PostgreSQL 'chambres'.
     * Conforme au cahier des charges HotelHub et aux endpoints de l'API.
     */
    public function up(): void
    {
        Schema::create('chambres', function (Blueprint $table) {
            $table->id();                                              // BIGSERIAL PK
            $table->string('numero', 10)->unique();                    // Numéro de chambre unique
            $table->enum('type', ['simple', 'double', 'suite', 'presidentielle']); // Type
            $table->unsignedTinyInteger('capacite');                   // Nombre de personnes max
            $table->decimal('prix_nuit', 10, 2);                      // Prix en MAD
            $table->text('description')->nullable();                   // Description
            $table->decimal('superficie', 6, 2)->nullable();          // Surface en m²
            $table->unsignedSmallInteger('etage')->nullable();        // Numéro d'étage
            $table->string('vue', 100)->nullable();                    // Type de vue
            $table->json('equipements')->nullable();                   // Liste d'équipements
            $table->json('images')->nullable();                        // Chemins des images
            $table->enum('statut', ['disponible', 'occupee', 'maintenance'])->default('disponible');
            $table->timestamps();                                      // created_at, updated_at
            $table->softDeletes();                                     // deleted_at (soft delete)
        });
    }

    /**
     * Supprime la table 'chambres'.
     */
    public function down(): void
    {
        Schema::dropIfExists('chambres');
    }
};
