<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('saisons') && !Schema::hasColumn('saisons', 'coefficient')) {
            Schema::table('saisons', function (Blueprint $table) {
                $table->decimal('coefficient', 5, 2)->default(1.00);
            });
        }

        if (Schema::hasTable('tarifs')) {
            Schema::table('tarifs', function (Blueprint $table) {
                if (!Schema::hasColumn('tarifs', 'numero_chambre')) {
                    $table->string('numero_chambre')->nullable()->index();
                }
                if (!Schema::hasColumn('tarifs', 'coefficient_saison')) {
                    $table->decimal('coefficient_saison', 5, 2)->default(1.00);
                }
                if (!Schema::hasColumn('tarifs', 'promotion_id')) {
                    $table->unsignedBigInteger('promotion_id')->nullable();
                }
                if (!Schema::hasColumn('tarifs', 'promotion_pourcent')) {
                    $table->decimal('promotion_pourcent', 5, 2)->default(0);
                }
                if (!Schema::hasColumn('tarifs', 'prix_base')) {
                    $table->decimal('prix_base', 10, 2)->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('saisons') && Schema::hasColumn('saisons', 'coefficient')) {
            Schema::table('saisons', function (Blueprint $table) {
                $table->dropColumn('coefficient');
            });
        }

        if (Schema::hasTable('tarifs')) {
            Schema::table('tarifs', function (Blueprint $table) {
                $cols = [
                    'numero_chambre',
                    'coefficient_saison',
                    'promotion_id',
                    'promotion_pourcent',
                    'prix_base',
                ];
                foreach ($cols as $col) {
                    if (Schema::hasColumn('tarifs', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};