<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('parcelles', function (Blueprint $table) {
            $table->decimal('niveau_reservoir', 5, 2)->nullable()->after('longitude');
        });
    }

    public function down(): void
    {
        Schema::table('parcelles', function (Blueprint $table) {
            $table->dropColumn('niveau_reservoir');
        });
    }
};
