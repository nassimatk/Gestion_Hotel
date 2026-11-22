<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('saisons') && !Schema::hasColumn('saisons', 'coefficient')) {
            Schema::table('saisons', function (Blueprint $table) {
                $table->decimal('coefficient', 5, 2)->default(1.00)->after('nom');
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
    }
};