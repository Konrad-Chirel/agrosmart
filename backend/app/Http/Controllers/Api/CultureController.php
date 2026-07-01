<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CultureRequest;
use App\Http\Resources\CultureResource;
use App\Models\BesoinHydrique;
use App\Models\Culture;
use App\Models\DecisionArrosage;
use App\Models\HistoriqueArrosage;
use App\Models\Parcelle;
use App\Services\ApiResponseService;
use App\Services\ProgrammeArrosageService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class CultureController extends Controller
{
    public function index(Request $request)
    {
        $cultures = Culture::with(['parcelle.lecturesCapteurs', 'parcelle.decisionsArrosage'])
            ->where('statut', 'active')
            ->whereHas('parcelle', fn ($query) => $query->where('user_id', $request->user()->id))
            ->latest()
            ->get()
            ->map(fn (Culture $culture) => $this->formatCultureForMobile($culture))
            ->values();

        return ApiResponseService::success('Cultures recuperees', [
            'cultures' => $cultures,
            'total_actives' => $cultures->count(),
            'parcelles_disponibles' => max(0, 5 - $cultures->count()),
        ]);
    }

    public function store(CultureRequest $request, ProgrammeArrosageService $programmeService)
    {
        $parcelle = $request->user()->parcelles()->findOrFail($request->parcelle_id);
        $data = $request->validated();
        $dateSemis = Carbon::createFromFormat('d/m/Y', $data['date_semis']);
        $semaineActuelle = max(1, intdiv($dateSemis->diffInDays(now()), 7) + 1);
        $besoinActuel = BesoinHydrique::where('type_culture', $data['type_culture'])
            ->where('semaine_debut', '<=', $semaineActuelle)
            ->where('semaine_fin', '>=', $semaineActuelle)
            ->first();

        $data['date_semis'] = $dateSemis->toDateString();
        $data['date_fin_prevue'] = $dateSemis
            ->addWeeks(CultureRequest::cycleWeeksFor($data['type_culture']))
            ->toDateString();
        $data['user_id'] = $request->user()->id;
        $data['superficie_m2'] = $data['superficie_m2'] ?? $parcelle->superficie_m2;
        $data['semaine_actuelle'] = $semaineActuelle;
        $data['stade_actuel'] = $besoinActuel?->stade;

        $activeCulture = $parcelle->cultures()->where('statut', 'active')->first();
        if ($activeCulture) {
            $message = $activeCulture->type_culture === $data['type_culture']
                ? "Cette parcelle contient déjà du {$activeCulture->type_culture} en cours de culture."
                : "Cette parcelle est déjà occupée par une autre culture active.";
            
            throw \Illuminate\Validation\ValidationException::withMessages([
                'parcelle_id' => [$message]
            ]);
        }

        $existingSameCulture = Culture::where('user_id', $request->user()->id)
            ->where('type_culture', $data['type_culture'])
            ->where('statut', 'active')
            ->first();

        if ($existingSameCulture) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'type_culture' => ["Vous avez déjà une culture de {$data['type_culture']} en cours sur une autre parcelle."]
            ]);
        }

        $culture = $parcelle->cultures()->create($data);
        $programme = $programmeService->generer($culture, $parcelle);

        return ApiResponseService::success('Culture enregistree', [
            'culture' => new CultureResource($culture),
            'programme' => $programme,
        ], 201);
    }

    public function show(Request $request, int $id, ProgrammeArrosageService $programmeService)
    {
        $culture = Culture::with(['parcelle.lecturesCapteurs', 'parcelle.decisionsArrosage', 'programmesArrosage'])
            ->whereHas('parcelle', fn ($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($id);

        if ($culture->programmesArrosage()->count() === 0 && $culture->parcelle) {
            $programmeService->generer($culture, $culture->parcelle);
            $culture->load('programmesArrosage');
        }

        return ApiResponseService::success('Culture recuperee', [
            ...$this->formatCultureForMobile($culture),
            'programme' => $culture->programmesArrosage()->orderBy('semaine_numero')->get(),
        ]);
    }

    public function programme(Request $request, int $id)
    {
        $culture = Culture::whereHas('parcelle', fn ($q) => $q->where('user_id', $request->user()->id))->findOrFail($id);

        return ApiResponseService::success('Programme recupere', $culture->programmesArrosage()->orderBy('semaine_numero')->get());
    }

    private function formatCultureForMobile(Culture $culture): array
    {
        $parcelle = $culture->parcelle;
        $lecture = $parcelle?->lecturesCapteurs()->latest('lu_le')->first();
        $decision = $parcelle?->decisionsArrosage()->where('culture_id', $culture->id)->latest()->first()
            ?: $parcelle?->decisionsArrosage()->latest()->first();

        $semaineActuelle = max(1, intdiv($culture->date_semis->diffInDays(now()), 7) + 1);
        $cycleSemaines = (int) (BesoinHydrique::where('type_culture', $culture->type_culture)->max('semaine_fin') ?: CultureRequest::cycleWeeksFor($culture->type_culture));
        $besoin = $culture->type_culture !== 'autre'
            ? BesoinHydrique::where('type_culture', $culture->type_culture)
                ->where('semaine_debut', '<=', $semaineActuelle)
                ->where('semaine_fin', '>=', $semaineActuelle)
                ->first()
            : null;

        $humidite = $lecture?->humidite_sol === null ? null : (float) $lecture->humidite_sol;
        $progression = min(100, max(0, (int) round(($semaineActuelle / max(1, $cycleSemaines)) * 100)));

        return [
            'id' => $culture->id,
            'parcelle_id' => $culture->parcelle_id,
            'parcelle_nom' => $parcelle?->nom_parcelle,
            'type_culture' => $culture->type_culture,
            'nom' => $this->cultureDisplayName($culture->type_culture),
            'nom_court' => $this->cultureShortName($culture->type_culture),
            'emoji' => $this->cultureEmoji($culture->type_culture),
            'stade' => $this->formatStage($besoin?->stade),
            'sante' => $this->healthLabel($humidite, $decision?->type_decision),
            'score_sante' => $this->healthScore($humidite, $decision?->type_decision),
            'alerte' => $this->hasWaterAlert($humidite, $decision?->type_decision),
            'semaine_actuelle' => min($semaineActuelle, $cycleSemaines),
            'cycle_semaines' => $cycleSemaines,
            'progression' => $progression,
            'prochain_arrosage' => $this->formatNextWatering($decision?->type_decision, $decision?->heure_programmee),
            'humidite_sol' => [
                'valeur' => $humidite,
                'texte' => $humidite === null ? 'En attente des sondes' : sprintf('%d%% (%s)', round($humidite), $this->humidityLabel($humidite)),
                'niveau' => $this->humidityLabel($humidite),
            ],
            'date_semis' => $culture->date_semis?->toDateString(),
            'date_fin_prevue' => $culture->date_fin_prevue?->toDateString(),
            'besoin_eau_l_m2_jour' => $besoin?->litres_par_m2_par_jour === null ? null : (float) $besoin->litres_par_m2_par_jour,
            'description_stade' => $besoin?->description_stade,
            'source_agronomique' => $besoin?->source_scientifique,
            'recolte' => $this->harvestForecast($culture, $parcelle, $progression, $this->healthScore($humidite, $decision?->type_decision), $humidite),
            'programme_semaine' => $this->currentWeekProgram($culture),
            'calendrier_arrosage' => $this->wateringCalendar($culture, $decision),
        ];
    }

    private function cultureDisplayName(string $type): string
    {
        return match ($type) {
            'tomate' => 'Tomates',
            'piment' => 'Piment',
            'oignon' => 'Oignon',
            'laitue' => 'Laitue',
            'mais' => 'Maïs Doux',
            'carotte' => 'Carotte',
            default => 'Autre culture',
        };
    }

    private function cultureShortName(string $type): string
    {
        return match ($type) {
            'tomate' => 'Tomate',
            'mais' => 'Maïs',
            default => $this->cultureDisplayName($type),
        };
    }

    private function cultureEmoji(string $type): string
    {
        return match ($type) {
            'tomate' => '🍅',
            'piment' => '🌶️',
            'oignon' => '🧅',
            'laitue' => '🥬',
            'mais' => '🌽',
            'carotte' => '🥕',
            default => '🌱',
        };
    }

    private function formatStage(?string $stage): string
    {
        if (!$stage) {
            return 'Suivi';
        }

        return ucfirst(str_replace('_', ' ', $stage));
    }

    private function healthLabel(?float $humidite, ?string $decision): string
    {
        if ($decision === 'arrosage_urgent' || ($humidite !== null && $humidite < 25)) {
            return "Besoin d'eau";
        }

        if ($humidite !== null && $humidite > 85) {
            return 'Risque d\'asphyxie';
        }

        if ($humidite !== null && $humidite < 35) {
            return 'À surveiller';
        }

        return 'Excellente santé';
    }

    private function hasWaterAlert(?float $humidite, ?string $decision): bool
    {
        return $decision === 'arrosage_urgent' || ($humidite !== null && ($humidite < 35 || $humidite > 85));
    }

    private function healthScore(?float $humidite, ?string $decision): int
    {
        if ($decision === 'arrosage_urgent') {
            return 45;
        }

        if ($humidite === null) {
            return 70;
        }

        if ($humidite >= 40 && $humidite <= 75) {
            return 98;
        }

        if ($humidite >= 25 && $humidite < 40) {
            return 72;
        }

        if ($humidite > 85) {
            return 40;
        }

        if ($humidite > 75) {
            return 82;
        }

        return 50;
    }

    private function humidityLabel(?float $humidite): string
    {
        if ($humidite === null) {
            return 'Inconnu';
        }

        if ($humidite < 25) {
            return 'Bas';
        }

        if ($humidite > 85) {
            return 'Saturé';
        }

        if ($humidite > 75) {
            return 'Élevé';
        }

        return 'Optimal';
    }

    private function formatNextWatering(?string $decision, mixed $heure): string
    {
        if ($decision === 'aucun_arrosage') {
            return 'Annulé';
        }

        if ($decision === 'arrosage_urgent') {
            return 'Immédiat';
        }

        if (!$heure) {
            return "Aujourd'hui, 18:00";
        }

        return "Aujourd'hui, " . Carbon::parse((string) $heure)->format('H:i');
    }

    private function currentWeekProgram(Culture $culture): ?array
    {
        $semaine = max(1, intdiv($culture->date_semis->diffInDays(now()), 7) + 1);
        $programme = $culture->programmesArrosage()
            ->where('semaine_numero', $semaine)
            ->first();

        if (! $programme) {
            return null;
        }

        return [
            'id' => $programme->id,
            'semaine_numero' => $programme->semaine_numero,
            'stade' => $this->formatStage($programme->stade),
            'volume_journalier_litres' => (float) $programme->volume_journalier_litres,
            'frequence_par_jour' => (int) $programme->frequence_par_jour,
            'date_debut_semaine' => $programme->date_debut_semaine?->toDateString(),
            'date_fin_semaine' => $programme->date_fin_semaine?->toDateString(),
            'recalcule_apres_pluie' => (bool) $programme->recalcule_apres_pluie,
        ];
    }

    private function wateringCalendar(Culture $culture, mixed $decision): array
    {
        $programmes = $culture->programmesArrosage()
            ->whereDate('date_fin_semaine', '>=', today()->startOfWeek())
            ->orderBy('semaine_numero')
            ->limit(3)
            ->get();

        // Récupérer les arrosages réels effectués cette semaine
        $arrosagesFaits = HistoriqueArrosage::where('culture_id', $culture->id)
            ->whereDate('debut_arrosage', '>=', today()->startOfWeek())
            ->get()
            ->map(fn ($h) => Carbon::parse($h->debut_arrosage))
            ->toArray();

        $seen = []; // dédoublonnage par (date, heure)
        $calendar = [];

        // On génère exactement les 7 jours de la semaine courante (Lundi -> Dimanche)
        $startOfWeek = today()->startOfWeek();
        $endOfWeek = today()->endOfWeek();

        for ($date = $startOfWeek->copy(); $date->lessThanOrEqualTo($endOfWeek); $date->addDay()) {
            // Trouver le programme correspondant à cette date
            $programme = $programmes->first(function ($p) use ($date) {
                return Carbon::parse($p->date_debut_semaine)->lessThanOrEqualTo($date)
                    && Carbon::parse($p->date_fin_semaine)->greaterThanOrEqualTo($date);
            });

            if (!$programme) {
                continue;
            }

            $frequence = max(1, (int) $programme->frequence_par_jour);
            $times = $frequence >= 2 ? ['06:00', '18:00'] : ['18:00'];
            $volumeSession = round((float) $programme->volume_journalier_litres / $frequence, 2);

            foreach ($times as $time) {
                $key = $date->toDateString() . '_' . $time;
                if (isset($seen[$key])) {
                    continue;
                }
                $seen[$key] = true;

                $eventDateTime = $date->toDateString() . ' ' . $time;
                $eventHour = (int) explode(':', $time)[0];

                // Vérifier s'il y a un arrosage réel à cette date ET dans la même tranche horaire (±2h)
                $fait = collect($arrosagesFaits)->contains(function (Carbon $arrosageDate) use ($date, $eventHour) {
                    if (!$arrosageDate->isSameDay($date)) return false;
                    $arrosageHour = (int) $arrosageDate->format('H');
                    return abs($arrosageHour - $eventHour) <= 2; // Tolérance de 2h
                });

                $eventDateObj = Carbon::parse($eventDateTime);
                $isPast = $eventDateObj->lessThan(now());
                
                $statut = 'a_venir';
                $description = sprintf('%s · %s L', $this->formatStage($programme->stade), number_format($volumeSession, 0, ',', ' '));

                if ($date->isSameDay(today()) && $decision && $decision->type_decision === 'aucun_arrosage') {
                    $statut = 'annule';
                    $description = $decision->raison;
                } elseif ($fait) {
                    $statut = 'fait';
                } elseif ($isPast) {
                    $statut = 'manque';
                }

                $calendar[] = [
                    'date'          => $date->toDateString(),
                    'jour'          => $this->dayLabel($date),
                    'heure'         => $time,
                    'type'          => 'arrosage',
                    'titre'         => 'Arrosage automatique',
                    'description'   => $description,
                    'volume_litres' => $volumeSession,
                    'stade'         => $this->formatStage($programme->stade),
                    'source'        => $programme->recalcule_apres_pluie ? 'Programme recalculé après pluie' : 'Base agronomique',
                    'statut'        => $statut,
                ];
            }
        }

        if ($decision && $decision->type_decision === 'arrosage_urgent') {
            array_unshift($calendar, [
                'date'          => today()->toDateString(),
                'jour'          => "Aujourd'hui",
                'heure'         => now()->format('H:i'),
                'type'          => 'urgent',
                'titre'         => 'Arrosage urgent',
                'description'   => $decision->raison,
                'volume_litres' => (float) $decision->volume_litres,
                'stade'         => null,
                'source'        => 'Moteur de décision',
                'statut'        => 'fait',
            ]);
        }

        // Ajouter les arrosages manuels programmés par l'utilisateur (distincts du programme intelligent)
        $manuels = DecisionArrosage::where('parcelle_id', $culture->parcelle_id)
            ->where('raison', 'Programmation manuelle via l\'application')
            ->whereDate('created_at', '>=', today()->startOfWeek())
            ->whereDate('created_at', '<=', today()->endOfWeek())
            ->get();

        foreach ($manuels as $manuelDecision) {
            $heureProgr = Carbon::parse($manuelDecision->heure_programmee);
            $dateStr = $heureProgr->toDateString();
            $heureStr = $heureProgr->format('H:i');

            // Vérifier si c'est déjà dans le calendrier auto (même date/heure)
            $dejaPresent = collect($calendar)->contains(fn ($c) => $c['date'] === $dateStr && $c['heure'] === $heureStr && $c['type'] === 'arrosage');
            if ($dejaPresent) continue;

            $statutManuel = 'a_venir';
            if ($manuelDecision->executee) {
                // Vérifier si c'est une annulation intelligente
                if (str_contains($manuelDecision->raison ?? '', 'Annulé automatiquement') || str_contains($manuelDecision->raison ?? '', 'Expiré')) {
                    $statutManuel = 'annule';
                } else {
                    $statutManuel = 'fait';
                }
            } elseif ($heureProgr->lessThan(now())) {
                $statutManuel = 'manque';
            }

            $calendar[] = [
                'date'          => $dateStr,
                'jour'          => $this->dayLabel(Carbon::parse($dateStr)),
                'heure'         => $heureStr,
                'type'          => 'manuel',
                'titre'         => 'Arrosage manuel',
                'description'   => sprintf('%s L · Programmé manuellement', number_format((float) $manuelDecision->volume_litres, 0, ',', ' ')),
                'volume_litres' => (float) $manuelDecision->volume_litres,
                'stade'         => null,
                'source'        => 'Programmation manuelle',
                'statut'        => $statutManuel,
            ];
        }

        // Trier par date puis heure
        usort($calendar, function ($a, $b) {
            $cmp = strcmp($a['date'], $b['date']);
            return $cmp !== 0 ? $cmp : strcmp($a['heure'], $b['heure']);
        });

        return array_values($calendar);
    }

    private function harvestForecast(Culture $culture, ?Parcelle $parcelle, int $progression, int $scoreSante = 100, ?float $humidite = null): array
    {
        $endDate = $culture->date_fin_prevue ?: $culture->date_semis->copy()->addWeeks(CultureRequest::cycleWeeksFor($culture->type_culture));
        $daysRemaining = max(0, today()->diffInDays($endDate, false));
        $yieldPerM2 = $this->yieldReference($culture->type_culture);
        $surface = $parcelle ? (float) $parcelle->superficie_m2 : 0;
        $expectedKg = round($yieldPerM2 * $surface, 1);
        $impact = null;

        if ($scoreSante < 50) {
            $penalty = 0.25; // 25% drop if severe asphyxia/dryness
            $expectedKg = round($expectedKg * (1 - $penalty), 1);
            $impact = "-25% (Risque santé élevé)";
        }

        return [
            'date_estimee' => $endDate->toDateString(),
            'jours_restants' => $daysRemaining,
            'progression' => $progression,
            'rendement_estime_kg' => $expectedKg,
            'rendement_estime_tonnes' => round($expectedKg / 1000, 2),
            'rendement_kg_m2' => $yieldPerM2,
            'impact_sante' => $impact,
            'source' => 'Cycle cultural et rendement indicatif par culture',
            'conseils' => $this->harvestAdvice($culture->type_culture, $daysRemaining, $humidite),
        ];
    }

    private function yieldReference(string $type): float
    {
        return match ($type) {
            'tomate' => 3.5,
            'piment' => 1.2,
            'oignon' => 2.5,
            'laitue' => 2.0,
            'mais' => 0.8,
            'carotte' => 2.8,
            default => 1.5,
        };
    }

    private function harvestAdvice(string $type, int $daysRemaining, ?float $humidite = null): array
    {
        $phase = $daysRemaining <= 14 ? 'phase finale' : 'croissance';

        $humiditeTitre = "Conditions optimales";
        $humiditeTexte = "L'humidité est idéale. Maintenez le programme d'arrosage actuel.";
        if ($humidite !== null) {
            if ($humidite > 85) {
                $humiditeTitre = "Alerte Saturation";
                $humiditeTexte = "Le sol est saturé. Stoppez tout arrosage et vérifiez le drainage pour éviter l'asphyxie racinaire.";
            } elseif ($humidite < 25) {
                $humiditeTitre = "Stress Hydrique";
                $humiditeTexte = "Le sol est trop sec. Un arrosage immédiat en profondeur est nécessaire pour sauver la culture.";
            }
        }

        return [
            [
                'titre' => $humiditeTitre,
                'texte' => $humiditeTexte,
            ],
            [
                'titre' => "Arrosage adapté",
                'texte' => match ($type) {
                    'tomate' => "Gardez une humidité régulière pour éviter l'éclatement des fruits.",
                    'oignon' => "Réduisez progressivement l'eau en fin de cycle pour favoriser la conservation.",
                    'laitue' => "Évitez les fortes chaleurs et arrosez de préférence tôt le matin.",
                    default => "Suivez le programme calculé avec la base agronomique.",
                },
            ],
        ];
    }

    private function dayLabel(Carbon $date): string
    {
        if ($date->isToday()) {
            return "Aujourd'hui";
        }

        if ($date->isTomorrow()) {
            return 'Demain';
        }

        return ucfirst($date->translatedFormat('l d M'));
    }
}
