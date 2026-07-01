<?php

namespace Database\Seeders;

use App\Models\BesoinHydrique;
use Illuminate\Database\Seeder;

class BesoinsHydriquesSeeder extends Seeder
{
    private const SOURCE = 'FAO Irrigation and Drainage Paper No. 56 - Crop Evapotranspiration (Allen et al., 1998) et donnees INRAB Benin';

    /**
     * Initialise la base agronomique scientifique utilisee par le moteur.
     */
    public function run(): void
    {
        BesoinHydrique::query()->delete();

        $rows = [
            ['tomate', 'germination', 1, 2, 2.0, 'La graine germe. Besoins faibles mais reguliers. Le sol doit rester humide sans etre detrempe.', 14],
            ['tomate', 'croissance', 3, 6, 4.0, 'Developpement foliaire actif. Les besoins en eau augmentent progressivement.', 14],
            ['tomate', 'floraison', 7, 9, 6.0, 'Stade critique. Un manque d eau provoque la chute des fleurs et une perte de rendement.', 14],
            ['tomate', 'fructification', 10, 12, 8.0, 'Besoins maximaux. Les fruits se developpent et necessitent une hydratation soutenue.', 14],
            ['tomate', 'maturation', 13, 14, 3.0, 'Reduction progressive pour concentrer les sucres et favoriser la conservation.', 14],
            ['piment', 'germination', 1, 2, 1.5, 'Levee progressive. Maintenir une humidite douce et reguliere.', 12],
            ['piment', 'croissance', 3, 5, 3.0, 'Croissance vegetative active avec arrosages moderes.', 12],
            ['piment', 'floraison', 6, 8, 5.0, 'Floraison sensible au stress hydrique. Arrosages reguliers necessaires.', 12],
            ['piment', 'fructification', 9, 10, 6.0, 'Formation des fruits. Les besoins en eau sont eleves.', 12],
            ['piment', 'maturation', 11, 12, 2.5, 'Reduction progressive des volumes avant recolte.', 12],
            ['oignon', 'germination', 1, 3, 1.5, 'Levee delicate. Sol humide mais pas detrempe pour eviter la pourriture.', 12],
            ['oignon', 'croissance', 4, 7, 3.0, 'Developpement du feuillage. Arrosages reguliers necessaires.', 12],
            ['oignon', 'bulbaison', 8, 10, 4.0, 'Formation du bulbe. Stade le plus exigeant en eau de la culture.', 12],
            ['oignon', 'maturation', 11, 12, 2.0, 'Reduction de l arrosage pour favoriser la conservation et le sechage du bulbe.', 12],
            ['mais', 'germination', 1, 2, 2.5, 'Installation de la plantule. Le sol doit rester frais.', 14],
            ['mais', 'croissance', 3, 7, 5.0, 'Croissance rapide et forte consommation d eau.', 14],
            ['mais', 'epiaison', 8, 10, 7.0, 'Stade critique absolu. Tout stress hydrique entraine des pertes de rendement irreversibles.', 14],
            ['mais', 'maturation', 11, 14, 3.0, 'Besoins reduits pendant le remplissage final et la maturation.', 14],
            ['laitue', 'germination', 1, 2, 1.0, 'Germination courte. Garder la surface humide sans exces.', 8],
            ['laitue', 'croissance', 3, 5, 2.5, 'Developpement des feuilles. Eau reguliere pour eviter le fletrissement.', 8],
            ['laitue', 'maturation', 6, 8, 1.5, 'Arrosage plus leger pour conserver la qualite des feuilles.', 8],
            ['carotte', 'germination', 1, 2, 2.0, 'Germination lente. Humidite reguliere indispensable.', 12],
            ['carotte', 'croissance', 3, 6, 3.5, 'Croissance du feuillage et installation racinaire.', 12],
            ['carotte', 'developpement', 7, 10, 4.0, 'Grossissement de la racine. Besoin stable en eau.', 12],
            ['carotte', 'maturation', 11, 12, 2.0, 'Reduction progressive avant recolte.', 12],
        ];

        foreach ($rows as [$culture, $stade, $debut, $fin, $litres, $description, $duree]) {
            BesoinHydrique::create([
                'type_culture' => $culture,
                'stade' => $stade,
                'semaine_debut' => $debut,
                'semaine_fin' => $fin,
                'litres_par_m2_par_jour' => $litres,
                'description_stade' => $description,
                'source_scientifique' => self::SOURCE,
                'duree_cycle_semaines' => $duree,
            ]);
        }
    }
}
