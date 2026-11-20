<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saisons', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 100);
            $table->date('date_debut');
            $table->date('date_fin');
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
            $table->timestampTz('deleted_at')->nullable();
        });

        DB::statement('ALTER TABLE saisons ADD CONSTRAINT chk_saisons_dates CHECK (date_fin >= date_debut)');
    }

    public function down(): void
    {
        Schema::dropIfExists('saisons');
    }
};