<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
echo 'PHP now(): ' . now() . PHP_EOL;
$dbNow = DB::select("SELECT datetime('now', 'localtime') as db_now")[0]->db_now;
echo 'DB NOW(): ' . $dbNow . PHP_EOL;
$diff = now()->diffInSeconds(\Carbon\Carbon::parse($dbNow));
echo 'Diff: ' . $diff . ' seconds' . PHP_EOL;
