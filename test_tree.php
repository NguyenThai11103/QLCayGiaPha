<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$ctrl = app(App\Http\Controllers\Api\NguoiController::class);
$thanhViens = Illuminate\Support\Facades\DB::table('thanh_viens')->get();

$ctl = new ReflectionClass(App\Http\Controllers\Api\NguoiController::class);
$m = $ctl->getMethod('mapThanhVienToNguoi');
$m->setAccessible(true);
$people = $m->invoke($ctrl, $thanhViens)->toArray();

$bloodlinePeople = [];
foreach($people as $p) {
    if ($p['id_dong_ho'] == 1) {
        $bloodlinePeople[] = $p;
    }
}
$bloodlineIds = array_map(function($p) { return $p['id']; }, $bloodlinePeople);

$rootMembers = [];
foreach ($bloodlinePeople as $p) {
    $hasFatherInBloodline = $p['id_cha'] && in_array($p['id_cha'], $bloodlineIds);
    $hasMotherInBloodline = $p['id_me'] && in_array($p['id_me'], $bloodlineIds);
    if ($hasFatherInBloodline || $hasMotherInBloodline) continue;

    $isSpouseOfOtherBloodline = false;
    foreach ($people as $other) {
        if (!in_array($other['id'], $bloodlineIds) || $other['id'] == $p['id']) continue;
        
        $isSpouse = in_array($p['id'], $other['vo_chong_ids'] ?? []);
        if (!$isSpouse) continue;

        $otherHasFather = $other['id_cha'] && in_array($other['id_cha'], $bloodlineIds);
        $otherHasMother = $other['id_me'] && in_array($other['id_me'], $bloodlineIds);
        
        if ($otherHasFather || $otherHasMother) {
            $isSpouseOfOtherBloodline = true;
            break;
        }

        if ($other['gioi_tinh'] === 'nam' && $p['gioi_tinh'] === 'nu') {
            $isSpouseOfOtherBloodline = true;
            break;
        }

        if ($other['gioi_tinh'] === $p['gioi_tinh'] && $other['id'] < $p['id']) {
            $isSpouseOfOtherBloodline = true;
            break;
        }
    }

    if (!$isSpouseOfOtherBloodline) {
        $rootMembers[] = $p;
    }
}

echo "Total bloodline: " . count($bloodlinePeople) . "\n";
echo "Roots found: " . count($rootMembers) . "\n";
if (count($rootMembers) > 0) {
    echo "Primary root ID: " . $rootMembers[0]['id'] . " - " . $rootMembers[0]['ten_day_du'] . "\n";
}

