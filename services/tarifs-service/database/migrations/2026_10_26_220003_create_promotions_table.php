<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->string('libelle', 100);
            $table->unsignedBigInteger('chambre_id')->nullable(); // NULL = toutes les chambres
            $table->string('type_reduction', 20);
            $table->decimal('valeur', 10, 2);
            $table->smallInteger('nuits_min')->default(1);
            $table->date('date_debut');
            $table->date('date_fin');
            $table->string('statut', 30)->default('active');
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
            $table->timestampTz('deleted_at')->nullable();
        });

        DB::statement("ALTER TABLE promotions ADD CONSTRAINT chk_promotions_type CHECK (type_reduction IN ('POURCENTAGE','MONTANT_FIXE'))");
        DB::statement('ALTER TABLE promotions ADD CONSTRAINT chk_promotions_valeur CHECK (valeur > 0)');
        DB::statement("ALTER TABLE promotions ADD CONSTRAINT chk_promotions_pourcentage CHECK (type_reduction <> 'POURCENTAGE' OR valeur < 100)");
        DB::statement('ALTER TABLE promotions ADD CONSTRAINT chk_promotions_nuits CHECK (nuits_min > 0)');
        DB::statement('ALTER TABLE promotions ADD CONSTRAINT chk_promotions_dates CHECK (date_fin >= date_debut)');
        DB::statement("ALTER TABLE promotions ADD CONSTRAINT chk_promotions_statut CHECK (statut IN ('active','inactive'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('promotions');
    }
};