<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TepTinSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('tep_tins')->insert([
            [
                'id_nguoi' => 1,
                'id_dong_ho' => 1,
                'duong_dan' => 'uploads/images/avatar_ong_noi.jpg',
                'loai' => 'hinh_anh',
                'mo_ta' => 'Ảnh chân dung ông Nguyễn Bá Đạo',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }
}
