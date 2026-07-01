<?php
require __DIR__.'/vendor/autoload.php';

$mqtt = new \PhpMqtt\Client\MqttClient('broker.emqx.io', 1883, 'TestSubscriber-'.rand(1, 1000));
$mqtt->connect();
echo "Subscribed to agrosmart/pompes/1...\n";
$mqtt->subscribe('agrosmart/pompes/1', function ($topic, $message) use ($mqtt) {
    echo "Received message on topic [$topic]: $message\n";
    $mqtt->interrupt();
}, 0);
$mqtt->loop(true, true);
$mqtt->disconnect();
