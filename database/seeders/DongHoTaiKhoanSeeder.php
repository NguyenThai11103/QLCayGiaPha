<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DongHoTaiKhoanSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('dong_ho_tai_khoans')->insert([
            [
                'id_dong_ho' => 1,
                'id_tai_khoan' => 1,
                'vai_tro' => 'chu_quan',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_dong_ho' => 1,
                'id_tai_khoan' => 2,
                'vai_tro' => 'thanh_vien',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }
}
