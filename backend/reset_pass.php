<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

\App\Models\User::first()->update([
    'password' => 'password',
    'mot_de_passe' => \Illuminate\Support\Facades\Hash::make('password')
]);
echo "Password reset to 'password'\n";
