<?php

namespace App\Console\Commands;

use App\Services\MqttService;
use Illuminate\Console\Command;

class SimulerLectureCapteurCommand extends Command
{
    protected $signature = 'agrosmart:simuler-lecture
                            {parcelle_id : ID de la parcelle}
                            {--humidite=45 : Humidite du sol en %}
                            {--vent=12 : Vitesse du vent}
                            {--luminosite=65000 : Luminosite}
                            {--niveau-reservoir= : Niveau reservoir en %}';

    protected $description = 'Simule une lecture ESP32 sans materiel (dev / tests)';

    public function handle(MqttService $mqttService): int
    {
        $payload = [
            'champ_id' => (int) $this->argument('parcelle_id'),
            'humidite' => (float) $this->option('humidite'),
            'vent' => (float) $this->option('vent'),
            'luminosite' => (float) $this->option('luminosite'),
        ];

        if ($this->option('niveau-reservoir') !== null) {
            $payload['niveau_reservoir'] = (float) $this->option('niveau-reservoir');
        }

        $lecture = $mqttService->traiterMessageCapteurs(json_encode($payload));

        if (! $lecture) {
            $this->error('Lecture non enregistree. Verifiez le payload et la parcelle.');

            return self::FAILURE;
        }

        $this->info("Lecture #{$lecture->id} enregistree pour la parcelle {$payload['champ_id']}.");

        return self::SUCCESS;
    }
}
