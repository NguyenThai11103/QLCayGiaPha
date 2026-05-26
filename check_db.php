<?php

use Illuminate\Support\Facades\DB;

include 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$data = DB::table('thanh_viens')->select('id', 'ho_ten', 'tinh_trang_song')->get();
echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
