<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajoute la temperature envoyee par le prototype ESP32.
     */
    public function up(): void
    {
        Schema::table('lectures_capteurs', function (Blueprint $table) {
            $table->decimal('temperature', 5, 2)->nullable()->after('humidite_sol');
        });
    }

    public function down(): void
    {
        Schema::table('lectures_capteurs', function (Blueprint $table) {
            $table->dropColumn('temperature');
        });
    }
};
