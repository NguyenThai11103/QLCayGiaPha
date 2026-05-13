<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class QuanHeSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('quan_hes')->insert([
            [
                'id_nguoi' => 1, // Nguyễn Bá Đạo
                'id_nguoi_lien_quan' => 2, // Trần Thị Nhàn
                'loai' => 'vo_chong',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }
}
