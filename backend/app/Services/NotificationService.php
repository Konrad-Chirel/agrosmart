<?php

namespace App\Services;

use App\Models\Alerte;
use App\Models\Parcelle;
use App\Models\User;
use Illuminate\Support\Facades\Http;

class NotificationService
{
    public function notifierSolSec(User $user, Parcelle $parcelle): void
    {
        $this->envoyer($user, $parcelle, 'sol_sec', 'rouge', 'Sol trop sec', 'Sol trop sec, arrosage immediat necessaire', 'arroser_maintenant');
    }

    public function notifierSolSature(User $user, Parcelle $parcelle, float $humidite): void
    {
        $this->envoyer($user, $parcelle, 'arrosage_urgent', 'rouge', 'Risque d\'asphyxie', "Alerte Asphyxie : Le taux d'humidité a atteint " . round($humidite) . "%. Veuillez vérifier le drainage de la parcelle.", 'voir_details');
    }

    public function notifierArrosageEffectue(User $user, float $volume): void
    {
        $this->envoyerSimple($user, 'arrosage_effectue', 'vert', 'Arrosage effectue', "Votre champ a recu {$volume} litres d'eau.");
    }

    public function notifierArrosagePreventif(User $user, string $heure): void
    {
        $this->envoyerSimple($user, 'arrosage_preventif', 'orange', 'Arrosage preventif', "Chaleur prevue demain, arrosage preventif programme a {$heure}");
    }

    public function notifierAucunArrosage(User $user, string $raison): void
    {
        $this->envoyerSimple($user, 'arrosage_effectue', 'vert', 'Pas d arrosage', $raison);
    }

    public function notifierArrosageUrgent(User $user, Parcelle $parcelle): void
    {
        $this->envoyer($user, $parcelle, 'arrosage_urgent', 'rouge', 'Arrosage urgent', 'Sol trop sec, arrosage immediat necessaire', 'arroser_maintenant');
    }

    public function notifierReservoirVide(User $user, Parcelle $parcelle, float $niveau): void
    {
        if ($this->alerteRecente($user, $parcelle, 'reservoir_vide')) {
            return;
        }

        $this->envoyer($user, $parcelle, 'reservoir_vide', 'rouge', 'Reservoir bas', "Niveau du reservoir critique : {$niveau}%.");
    }

    public function notifierFuiteDetectee(User $user, Parcelle $parcelle): void
    {
        if ($this->alerteRecente($user, $parcelle, 'fuite_detectee')) {
            return;
        }

        $this->envoyer($user, $parcelle, 'fuite_detectee', 'rouge', 'Fuite detectee', "Perte d'eau anormale detectee pendant l'arrosage.");
    }

    public function notifierPluieDetectee(User $user, Parcelle $parcelle): void
    {
        $this->envoyer($user, $parcelle, 'pluie_detectee', 'vert', 'Pluie detectee', "La pluie a apporte de l'eau a votre champ.");
    }

    public function notifierCapteurDeconnecte(User $user, Parcelle $parcelle): void
    {
        $this->envoyer($user, $parcelle, 'capteur_deconnecte', 'orange', 'Sondes en attente', 'Aucune donnee recue depuis plus de 30 minutes.');
    }

    private function envoyer(User $user, Parcelle $parcelle, string $type, string $niveau, string $titre, string $message, ?string $action = null): void
    {
        Alerte::create([
            'parcelle_id' => $parcelle->id,
            'user_id' => $user->id,
            'type_alerte' => $type,
            'niveau' => $niveau,
            'titre' => $titre,
            'message' => $message,
            'action_disponible' => $action,
            'notification_envoyee' => (bool) $user->fcm_token,
        ]);

        $this->push($user, $titre, $message);
    }

    private function envoyerSimple(User $user, string $type, string $niveau, string $titre, string $message): void
    {
        $parcelle = $user->parcelles()->first();
        if ($parcelle) {
            $this->envoyer($user, $parcelle, $type, $niveau, $titre, $message);
        } else {
            $this->push($user, $titre, $message);
        }
    }

    private function alerteRecente(User $user, Parcelle $parcelle, string $type): bool
    {
        return Alerte::where('user_id', $user->id)
            ->where('parcelle_id', $parcelle->id)
            ->where('type_alerte', $type)
            ->where('created_at', '>=', now()->subHours(6))
            ->exists();
    }

    private function push(User $user, string $titre, string $message): void
    {
        if (! $user->fcm_token || ! config('services.firebase.server_key')) {
            return;
        }

        Http::withHeaders([
            'Authorization' => 'key='.config('services.firebase.server_key'),
        ])->post('https://fcm.googleapis.com/fcm/send', [
            'to' => $user->fcm_token,
            'notification' => [
                'title' => $titre,
                'body' => $message,
            ],
        ]);
    }
}
