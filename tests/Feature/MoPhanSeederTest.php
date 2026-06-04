<?php

use Database\Seeders\ComplexClanSeeder;
use Database\Seeders\DongHoSeeder;
use Database\Seeders\MoPhanSeeder;
use Database\Seeders\NguoiDungSeeder;
use Database\Seeders\ThanhVienSeeder;
use Illuminate\Support\Facades\DB;

it('seeds grave locations that match existing deceased family members', function () {
    $this->seed([
        DongHoSeeder::class,
        ThanhVienSeeder::class,
        NguoiDungSeeder::class,
        ComplexClanSeeder::class,
        MoPhanSeeder::class,
    ]);

    expect(DB::table('mo_phans')->count())->toBeGreaterThan(0);

    $invalidMembers = DB::table('mo_phans')
        ->join('thanh_viens', 'mo_phans.thanh_vien_id', '=', 'thanh_viens.id')
        ->whereColumn('mo_phans.dong_ho_id', '!=', 'thanh_viens.dong_ho_id')
        ->orWhere('thanh_viens.tinh_trang_song', '!=', 0)
        ->count();

    expect($invalidMembers)->toBe(0);

    $invalidUpdaters = DB::table('mo_phans')
        ->leftJoin('nguoi_dungs', 'mo_phans.nguoi_cap_nhat_id', '=', 'nguoi_dungs.id')
        ->whereNotNull('mo_phans.nguoi_cap_nhat_id')
        ->whereColumn('mo_phans.dong_ho_id', '!=', 'nguoi_dungs.dong_ho_id')
        ->count();

    expect($invalidUpdaters)->toBe(0);
});
