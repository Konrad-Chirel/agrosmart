<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lectures_capteurs', function (Blueprint $table) {
            $table->string('source')->default('esp32')->after('luminosite');
        });
    }

    public function down(): void
    {
        Schema::table('lectures_capteurs', function (Blueprint $table) {
            $table->dropColumn('source');
        });
    }
};
