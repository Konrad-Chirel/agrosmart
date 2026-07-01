<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Capacite du reservoir (litres)
    |--------------------------------------------------------------------------
    |
    | Utilisee pour estimer le niveau affiche sur le dashboard lorsqu'aucun
    | capteur de reservoir n'est branche sur l'ESP32.
    |
    */

    'reservoir_capacite_litres' => (int) env('RESERVOIR_CAPACITE_LITRES', 1000),

    /*
    |--------------------------------------------------------------------------
    | Seuil d'alerte reservoir bas (%)
    |--------------------------------------------------------------------------
    */

    'reservoir_seuil_alerte_pct' => (float) env('RESERVOIR_SEUIL_ALERTE_PCT', 15),

    /*
    |--------------------------------------------------------------------------
    | Débit nominal de la pompe (Litres par minute)
    |--------------------------------------------------------------------------
    |
    | Utilisé pour convertir les durées d'arrosage en volumes ou inversement,
    | si aucun débitmètre réel n'est utilisé.
    |
    */

    'debit_pompe_l_min' => (float) env('DEBIT_POMPE_L_MIN', 80),

];
