<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    | Autorise le frontend Expo Web (localhost:8081/8082) et mobile (LAN)
    | à communiquer avec l'API Laravel.
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:8081',
        'http://localhost:8082',
        'http://localhost:19006',
        'http://127.0.0.1:8081',
        'http://127.0.0.1:8082',
        'http://127.0.0.1:19006',
        // Mobile Expo Go (LAN - remplacez si votre IP change)
        'http://192.168.157.84:8082',
        'http://192.168.157.84:19006',
        'exp://192.168.157.84:8082',
    ],

    'allowed_origins_patterns' => [
        // Autorise toute IP locale (192.168.x.x ou 10.x.x.x) pour le mobile
        '#^https?://192\.168\.\d+\.\d+(:\d+)?$#',
        '#^https?://10\.\d+\.\d+\.\d+(:\d+)?$#',
        '#^exp://.*#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
