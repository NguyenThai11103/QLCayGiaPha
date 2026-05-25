<?php
define('LARAVEL_START', microtime(true));
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    $dongHo = DB::table('dong_hos')->first();
    echo "Dong ho: " . json_encode($dongHo) . "\n";
    
    $user = DB::table('users')->first();
    echo "User: " . json_encode($user) . "\n";
    
    $thanhVien = DB::table('thanh_viens')->first();
    echo "Thanh vien: " . json_encode($thanhVien) . "\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
