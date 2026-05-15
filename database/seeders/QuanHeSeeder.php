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
                'node_1_id' => 1, // Nguyễn Bá Đạo
                'node_2_id' => 2, // Trần Thị Nhàn
                'loai_quan_he' => 'vo_chong',
                'tinh_chat_quan_he' => null,
                'tinh_trang_hon_nhan' => 'dang_ket_hon',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'node_1_id' => 1, // Nguyễn Bá Đạo (Cha)
                'node_2_id' => 3, // Nguyễn Bá Bình (Con)
                'loai_quan_he' => 'cha_con',
                'tinh_chat_quan_he' => 'ruot_thit',
                'tinh_trang_hon_nhan' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'node_1_id' => 2, // Trần Thị Nhàn (Mẹ)
                'node_2_id' => 3, // Nguyễn Bá Bình (Con)
                'loai_quan_he' => 'me_con',
                'tinh_chat_quan_he' => 'ruot_thit',
                'tinh_trang_hon_nhan' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'node_1_id' => 3, // Nguyễn Bá Bình (Cha)
                'node_2_id' => 4, // Nguyễn Bá Cường (Con)
                'loai_quan_he' => 'cha_con',
                'tinh_chat_quan_he' => 'ruot_thit',
                'tinh_trang_hon_nhan' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }
}
