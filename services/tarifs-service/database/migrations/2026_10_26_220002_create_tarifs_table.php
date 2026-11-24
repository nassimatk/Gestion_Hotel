<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tarifs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('chambre_id');
            $table->foreignId('saison_id')->nullable()->constrained('saisons');
            $table->decimal('prix_nuit', 10, 2);
            $table->char('devise', 3)->default('MAD');
            $table->string('statut', 30)->default('active');
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
            $table->timestampTz('deleted_at')->nullable();
        });

        DB::statement('ALTER TABLE tarifs ADD CONSTRAINT chk_tarifs_prix CHECK (prix_nuit > 0)');
        DB::statement("ALTER TABLE tarifs ADD CONSTRAINT chk_tarifs_statut CHECK (statut IN ('active','inactive'))");

        // Un seul tarif actif par chambre et par saison (RG4)
        DB::statement('CREATE UNIQUE INDEX uq_tarifs_chambre_saison ON tarifs (chambre_id, saison_id) WHERE deleted_at IS NULL AND saison_id IS NOT NULL');
        // Un seul tarif standard (hors saison) par chambre
        DB::statement('CREATE UNIQUE INDEX uq_tarifs_chambre_standard ON tarifs (chambre_id) WHERE deleted_at IS NULL AND saison_id IS NULL');
    }

    public function down(): void
    {
        Schema::dropIfExists('tarifs');
    }
};