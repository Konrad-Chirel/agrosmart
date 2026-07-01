<?php
require __DIR__.'/vendor/autoload.php';

$mqtt = new \PhpMqtt\Client\MqttClient('test.mosquitto.org', 1883, 'TestSubSensorsMosq-'.rand(1, 1000));
$mqtt->connect();
echo "Subscribed to agrosmart/sensors/1 on Mosquitto...\n";
$mqtt->subscribe('agrosmart/sensors/1', function ($topic, $message) use ($mqtt) {
    echo "Received sensor data: $message\n";
    $mqtt->interrupt();
}, 0);
$mqtt->loop(true, true);
$mqtt->disconnect();
