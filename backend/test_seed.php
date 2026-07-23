<?php
$u = new App\Models\User;
$u->name = 'Agriculteur Test';
$u->email = 'test@agrosmart.com';
$u->password = Hash::make('password');
$u->save();

$p = new App\Models\Parcelle;
$p->user_id = $u->id;
$p->nom = 'Ma Parcelle Principale';
$p->surface_m2 = 100;
$p->save();

echo "User created: test@agrosmart.com / password";
