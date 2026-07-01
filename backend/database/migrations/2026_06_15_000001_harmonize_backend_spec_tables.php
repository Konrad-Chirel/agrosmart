<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (! Schema::hasColumn('users', 'mot_de_passe')) {
                    $table->string('mot_de_passe')->nullable();
                }
                if (! Schema::hasColumn('users', 'source_donnees')) {
                    $table->string('source_donnees', 20)->default('simulation');
                }
            });
        }

        if (Schema::hasTable('cultures')) {
            Schema::table('cultures', function (Blueprint $table) {
                if (! Schema::hasColumn('cultures', 'user_id')) {
                    $table->unsignedBigInteger('user_id')->nullable();
                }
                if (! Schema::hasColumn('cultures', 'superficie_m2')) {
                    $table->decimal('superficie_m2', 10, 2)->nullable();
                }
                if (! Schema::hasColumn('cultures', 'semaine_actuelle')) {
                    $table->unsignedInteger('semaine_actuelle')->default(1);
                }
                if (! Schema::hasColumn('cultures', 'stade_actuel')) {
                    $table->string('stade_actuel', 50)->nullable();
                }
            });

            DB::statement(
                "UPDATE cultures
                 SET user_id = (
                    SELECT parcelles.user_id FROM parcelles WHERE parcelles.id = cultures.parcelle_id
                 )
                 WHERE user_id IS NULL"
            );

            DB::statement(
                "UPDATE cultures
                 SET superficie_m2 = (
                    SELECT parcelles.superficie_m2 FROM parcelles WHERE parcelles.id = cultures.parcelle_id
                 )
                 WHERE superficie_m2 IS NULL"
            );
        }

        if (Schema::hasTable('lectures_capteurs')) {
            Schema::table('lectures_capteurs', function (Blueprint $table) {
                if (! Schema::hasColumn('lectures_capteurs', 'statut')) {
                    $table->string('statut', 30)->default('ok');
                }
            });
        }

        if (Schema::hasTable('programmes_arrosage')) {
            Schema::table('programmes_arrosage', function (Blueprint $table) {
                if (! Schema::hasColumn('programmes_arrosage', 'litres_par_m2')) {
                    $table->decimal('litres_par_m2', 5, 2)->default(0);
                }
                if (! Schema::hasColumn('programmes_arrosage', 'volume_ajuste_litres')) {
                    $table->decimal('volume_ajuste_litres', 8, 2)->default(0);
                }
                if (! Schema::hasColumn('programmes_arrosage', 'heure_recommandee')) {
                    $table->time('heure_recommandee')->default('06:30');
                }
                if (! Schema::hasColumn('programmes_arrosage', 'eau_pluie_deduite')) {
                    $table->decimal('eau_pluie_deduite', 8, 2)->default(0);
                }
                if (! Schema::hasColumn('programmes_arrosage', 'recalcule_apres_arrosage')) {
                    $table->boolean('recalcule_apres_arrosage')->default(false);
                }
            });
        }

        if (Schema::hasTable('decisions_arrosage')) {
            Schema::table('decisions_arrosage', function (Blueprint $table) {
                if (! Schema::hasColumn('decisions_arrosage', 'besoin_base_litres')) {
                    $table->decimal('besoin_base_litres', 8, 2)->default(0);
                }
                if (! Schema::hasColumn('decisions_arrosage', 'eau_recue_litres')) {
                    $table->decimal('eau_recue_litres', 8, 2)->default(0);
                }
                if (! Schema::hasColumn('decisions_arrosage', 'volume_recommande_litres')) {
                    $table->decimal('volume_recommande_litres', 8, 2)->default(0);
                }
                if (! Schema::hasColumn('decisions_arrosage', 'heure_recommandee')) {
                    $table->time('heure_recommandee')->nullable();
                }
                if (! Schema::hasColumn('decisions_arrosage', 'humidite_sol_au_moment')) {
                    $table->decimal('humidite_sol_au_moment', 5, 2)->nullable();
                }
                if (! Schema::hasColumn('decisions_arrosage', 'temperature_au_moment')) {
                    $table->decimal('temperature_au_moment', 5, 2)->nullable();
                }
                if (! Schema::hasColumn('decisions_arrosage', 'message_affiche')) {
                    $table->string('message_affiche', 255)->default('');
                }
            });
        }

        if (Schema::hasTable('alertes')) {
            Schema::table('alertes', function (Blueprint $table) {
                if (! Schema::hasColumn('alertes', 'niveau')) {
                    $table->string('niveau', 10)->default('vert');
                }
                if (! Schema::hasColumn('alertes', 'titre')) {
                    $table->string('titre', 100)->default('Information');
                }
                if (! Schema::hasColumn('alertes', 'action_disponible')) {
                    $table->string('action_disponible', 50)->nullable();
                }
                if (! Schema::hasColumn('alertes', 'acquittee')) {
                    $table->boolean('acquittee')->default(false);
                }
                if (! Schema::hasColumn('alertes', 'notification_envoyee')) {
                    $table->boolean('notification_envoyee')->default(false);
                }
            });
        }

        if (! Schema::hasTable('cache_meteo')) {
            Schema::create('cache_meteo', function (Blueprint $table) {
                $table->id();
                $table->foreignId('parcelle_id')->constrained('parcelles')->cascadeOnDelete();
                $table->decimal('temperature', 5, 2);
                $table->decimal('humidite_air', 5, 2);
                $table->decimal('vitesse_vent', 5, 2);
                $table->string('description', 255);
                $table->string('icone', 20);
                $table->boolean('pluie_prevue_demain')->default(false);
                $table->boolean('chaleur_prevue_demain')->default(false);
                $table->decimal('coefficient_evaporation', 4, 2);
                $table->text('previsions_48h')->nullable();
                $table->timestamp('valide_jusqu_a');
                $table->timestamp('created_at')->useCurrent();
            });
        }

        if (! Schema::hasTable('arrosages_programmes')) {
            Schema::create('arrosages_programmes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('culture_id')->constrained('cultures')->cascadeOnDelete();
                $table->foreignId('parcelle_id')->constrained('parcelles')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->date('date_arrosage');
                $table->time('heure_arrosage');
                $table->unsignedInteger('duree_minutes');
                $table->decimal('volume_estime_litres', 8, 2);
                $table->string('statut', 20)->default('planifie');
                $table->decimal('volume_reel_litres', 8, 2)->nullable();
                $table->unsignedInteger('duree_reelle_minutes')->nullable();
                $table->boolean('commande_mqtt_envoyee')->default(false);
                $table->boolean('programme_recalcule')->default(false);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('historique_arrosages')) {
            Schema::create('historique_arrosages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('parcelle_id')->constrained('parcelles')->cascadeOnDelete();
                $table->foreignId('culture_id')->constrained('cultures')->cascadeOnDelete();
                $table->foreignId('arrosage_programme_id')->nullable()->constrained('arrosages_programmes')->nullOnDelete();
                $table->foreignId('decision_id')->nullable()->constrained('decisions_arrosage')->nullOnDelete();
                $table->string('type_declenchement', 20);
                $table->decimal('volume_litres', 8, 2);
                $table->unsignedInteger('duree_minutes');
                $table->timestamp('debut_arrosage');
                $table->timestamp('fin_arrosage')->nullable();
                $table->timestamp('commande_mqtt_on')->nullable();
                $table->timestamp('commande_mqtt_off')->nullable();
                $table->boolean('programme_recalcule_apres')->default(false);
                $table->timestamp('created_at')->useCurrent();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('historique_arrosages');
        Schema::dropIfExists('arrosages_programmes');
        Schema::dropIfExists('cache_meteo');
    }
};
