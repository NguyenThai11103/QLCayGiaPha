<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SuKienSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('su_kiens')->insert([
            [
                'id_dong_ho' => 1,
                'tieu_de' => 'Giỗ tổ Họ Nguyễn Bá năm 2024',
                'noi_dung' => 'Họp mặt toàn thể con cháu họ Nguyễn Bá để cúng giỗ',
                'ngay_dien_ra' => '2024-03-10', // Ngày âm lịch giả định
                'dia_diem' => 'Nhà thờ tổ Nguyễn Bá',
                'id_nguoi_tao' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }
}
