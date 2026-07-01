<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crée les tables métier AgroSmart et la base agronomique PostgreSQL.
     */
    public function up(): void
    {
        Schema::create('parcelles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('nom_parcelle');
            $table->decimal('superficie_m2', 8, 2);
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->timestamps();
        });

        Schema::create('cultures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parcelle_id')->constrained('parcelles')->cascadeOnDelete();
            $table->enum('type_culture', ['tomate', 'piment', 'oignon', 'laitue', 'mais', 'carotte', 'autre']);
            $table->date('date_semis');
            $table->date('date_fin_prevue');
            $table->enum('statut', ['active', 'terminee'])->default('active');
            $table->timestamps();
        });

        Schema::create('besoins_hydriques', function (Blueprint $table) {
            $table->id();
            $table->enum('type_culture', ['tomate', 'piment', 'oignon', 'laitue', 'mais', 'carotte']);
            $table->enum('stade', ['germination', 'croissance', 'floraison', 'fructification', 'bulbaison', 'epiaison', 'developpement', 'maturation']);
            $table->unsignedInteger('semaine_debut');
            $table->unsignedInteger('semaine_fin');
            $table->decimal('litres_par_m2_par_jour', 5, 2);
            $table->text('description_stade');
            $table->string('source_scientifique');
            $table->unsignedInteger('duree_cycle_semaines')->default(0);
            $table->timestamps();
        });

        Schema::create('lectures_capteurs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parcelle_id')->constrained('parcelles')->cascadeOnDelete();
            $table->decimal('humidite_sol', 5, 2);
            $table->decimal('vitesse_vent', 5, 2);
            $table->decimal('luminosite', 10, 2);
            $table->timestampTz('lu_le');
            $table->timestamps();
        });

        Schema::create('decisions_arrosage', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parcelle_id')->constrained('parcelles')->cascadeOnDelete();
            $table->foreignId('culture_id')->constrained('cultures')->cascadeOnDelete();
            $table->enum('type_decision', ['arrosage_urgent', 'arrosage_programme', 'arrosage_preventif', 'aucun_arrosage']);
            $table->decimal('volume_litres', 8, 2)->default(0);
            $table->time('heure_programmee')->nullable();
            $table->text('raison');
            $table->decimal('deficit_calcule', 8, 2)->default(0);
            $table->decimal('coefficient_evaporation', 4, 2)->default(1);
            $table->boolean('pluie_detectee')->default(false);
            $table->boolean('executee')->default(false);
            $table->timestamps();
        });

        Schema::create('arrosages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parcelle_id')->constrained('parcelles')->cascadeOnDelete();
            $table->foreignId('decision_id')->nullable()->constrained('decisions_arrosage')->nullOnDelete();
            $table->decimal('volume_litres', 8, 2);
            $table->unsignedInteger('duree_minutes');
            $table->enum('declenche_par', ['automatique', 'manuel']);
            $table->timestampTz('debut_arrosage');
            $table->timestampTz('fin_arrosage')->nullable();
            $table->timestamps();
        });

        Schema::create('alertes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parcelle_id')->constrained('parcelles')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('type_alerte', ['sol_sec', 'reservoir_vide', 'fuite_detectee', 'arrosage_effectue', 'arrosage_preventif', 'arrosage_urgent']);
            $table->text('message');
            $table->boolean('lue')->default(false);
            $table->timestamps();
        });

        Schema::create('programmes_arrosage', function (Blueprint $table) {
            $table->id();
            $table->foreignId('culture_id')->constrained('cultures')->cascadeOnDelete();
            $table->foreignId('parcelle_id')->constrained('parcelles')->cascadeOnDelete();
            $table->unsignedInteger('semaine_numero');
            $table->string('stade');
            $table->decimal('volume_journalier_litres', 8, 2);
            $table->unsignedInteger('frequence_par_jour');
            $table->date('date_debut_semaine');
            $table->date('date_fin_semaine');
            $table->boolean('recalcule_apres_pluie')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Supprime les tables dans l'ordre inverse des dépendances.
     */
    public function down(): void
    {
        Schema::dropIfExists('programmes_arrosage');
        Schema::dropIfExists('alertes');
        Schema::dropIfExists('arrosages');
        Schema::dropIfExists('decisions_arrosage');
        Schema::dropIfExists('lectures_capteurs');
        Schema::dropIfExists('besoins_hydriques');
        Schema::dropIfExists('cultures');
        Schema::dropIfExists('parcelles');
    }
};
