<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('arrosages', function (Blueprint $table) {
            $table->decimal('duree_minutes', 8, 2)->change();
        });

        Schema::table('arrosages_programmes', function (Blueprint $table) {
            $table->decimal('duree_minutes', 8, 2)->change();
            $table->decimal('duree_reelle_minutes', 8, 2)->nullable()->change();
        });

        Schema::table('historique_arrosages', function (Blueprint $table) {
            $table->decimal('duree_minutes', 8, 2)->change();
        });
    }

    public function down(): void
    {
        Schema::table('arrosages', function (Blueprint $table) {
            $table->unsignedInteger('duree_minutes')->change();
        });

        Schema::table('arrosages_programmes', function (Blueprint $table) {
            $table->unsignedInteger('duree_minutes')->change();
            $table->unsignedInteger('duree_reelle_minutes')->nullable()->change();
        });

        Schema::table('historique_arrosages', function (Blueprint $table) {
            $table->unsignedInteger('duree_minutes')->change();
        });
    }
};
