<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SuKienSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('su_kiens')->insert([
            [
                'dong_ho_id' => 1,
                'ten_su_kien' => 'Giỗ tổ Họ Nguyễn Bá năm 2024',
                'mo_ta' => 'Họp mặt toàn thể con cháu họ Nguyễn Bá để cúng giỗ',
                'ngay_duong' => Carbon::now()->startOfYear()->addMonths(2)->addDays(9)->format('Y-m-d'),
                'ngay_am' => '2024-03-10', // Ngày âm lịch giả định
                'dia_diem' => 'Nhà thờ tổ Nguyễn Bá',
                'loai_su_kien' => 'le_gio',
                'lap_lai_hang_nam' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 1,
                'ten_su_kien' => 'Họp mặt đầu năm Giáp Thìn',
                'mo_ta' => 'Gặp gỡ, chúc tết và bàn bạc các kế hoạch của dòng họ trong năm',
                'ngay_duong' => '2024-02-15',
                'ngay_am' => '2024-01-06',
                'dia_diem' => 'Nhà thờ tổ Nguyễn Bá',
                'loai_su_kien' => 'hop_dong_ho',
                'lap_lai_hang_nam' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 1,
                'ten_su_kien' => 'Lễ mừng thọ các cụ cao tuổi',
                'mo_ta' => 'Tổ chức mừng thọ cho các ông bà, cụ trong họ đạt tuổi 70, 80, 90',
                'ngay_duong' => '2024-08-15',
                'ngay_am' => '2024-07-15',
                'dia_diem' => 'Nhà văn hóa thôn',
                'loai_su_kien' => 'le_mung_tho',
                'lap_lai_hang_nam' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 1,
                'ten_su_kien' => 'Khánh thành tu sửa nhà thờ',
                'mo_ta' => 'Lễ khánh thành sau đợt đại tu bổ nhà thờ tổ họ Nguyễn Bá',
                'ngay_duong' => '2023-11-20',
                'ngay_am' => '2023-10-08',
                'dia_diem' => 'Nhà thờ tổ Nguyễn Bá',
                'loai_su_kien' => 'khac',
                'lap_lai_hang_nam' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 1,
                'ten_su_kien' => 'Trao quỹ khuyến học',
                'mo_ta' => 'Trao phần thưởng cho các con cháu có thành tích học tập xuất sắc',
                'ngay_duong' => '2024-09-02',
                'ngay_am' => null,
                'dia_diem' => 'Nhà thờ tổ Nguyễn Bá',
                'loai_su_kien' => 'khuyen_hoc',
                'lap_lai_hang_nam' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
