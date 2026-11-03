<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('avis', function (Blueprint $table) {
            $table->id();

            // Identifiants provenant des autres microservices
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('chambre_id');

            // Note comprise entre 1 et 5
            $table->unsignedTinyInteger('note');
            $table->text('commentaire');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('avis');
    }
};