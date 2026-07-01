<?php

namespace App\Console\Commands;

use App\Services\MqttService;
use Illuminate\Console\Command;

class EcouterCapteursCommand extends Command
{
    protected $signature = 'mqtt:listen';

    protected $description = 'Ecoute le topic MQTT champ/capteurs et enregistre les mesures ESP32';

    public function handle(MqttService $mqttService): int
    {
        $host = config('mqtt-client.connections.default.host');
        $port = config('mqtt-client.connections.default.port');

        $this->info("Connexion MQTT {$host}:{$port}...");
        $this->info('Ecoute du topic agrosmart/sensors/+ (Ctrl+C pour arreter).');

        $mqttService->ecouterCapteurs();

        return self::SUCCESS;
    }
}
