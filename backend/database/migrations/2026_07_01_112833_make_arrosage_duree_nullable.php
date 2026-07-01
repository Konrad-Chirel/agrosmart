<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('arrosages', function (Blueprint $table) {
            $table->unsignedInteger('duree_minutes')->nullable()->change();
            $table->decimal('volume_litres', 8, 2)->nullable()->change();
        });

        Schema::table('historique_arrosages', function (Blueprint $table) {
            $table->unsignedInteger('duree_minutes')->nullable()->change();
            $table->decimal('volume_litres', 8, 2)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('arrosages', function (Blueprint $table) {
            $table->unsignedInteger('duree_minutes')->nullable(false)->change();
            $table->decimal('volume_litres', 8, 2)->nullable(false)->change();
        });

        Schema::table('historique_arrosages', function (Blueprint $table) {
            $table->unsignedInteger('duree_minutes')->nullable(false)->change();
            $table->decimal('volume_litres', 8, 2)->nullable(false)->change();
        });
    }
};
