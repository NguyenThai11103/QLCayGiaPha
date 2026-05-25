<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SuKienSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('su_kiens')->insert([
            // ----------------------------------------------------------------
            // DÒNG HỌ 1: NGUYỄN BÁ
            // ----------------------------------------------------------------
            [
                'dong_ho_id' => 1,
                'ten_su_kien' => 'Giỗ tổ Họ Nguyễn Bá năm 2026',
                'mo_ta' => 'Họp mặt toàn thể con cháu họ Nguyễn Bá để cúng giỗ',
                'ngay_duong' => $now->copy()->addDays(5)->format('Y-m-d'),
                'ngay_am' => $now->copy()->addDays(5)->subMonths(1)->format('Y-m-d'),
                'dia_diem' => 'Nhà thờ tổ Nguyễn Bá',
                'loai_su_kien' => 'le_gio',
                'lap_lai_hang_nam' => true,
                'created_at' => now(), 'updated_at' => now(),
            ],

            // ----------------------------------------------------------------
            // DÒNG HỌ 2: TRẦN LÊ
            // ----------------------------------------------------------------
            [
                'dong_ho_id' => 2,
                'ten_su_kien' => 'Giỗ Cụ Tổ Trần Lê Phúc',
                'mo_ta' => 'Lễ giỗ cụ tổ khởi nghiệp dòng họ Trần Lê',
                'ngay_duong' => $now->copy()->addDays(2)->format('Y-m-d'),
                'ngay_am' => $now->copy()->addDays(2)->subMonths(1)->format('Y-m-d'),
                'dia_diem' => 'Từ đường Trần Lê, Nam Định',
                'loai_su_kien' => 'le_gio',
                'lap_lai_hang_nam' => true,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 2,
                'ten_su_kien' => 'Họp mặt con cháu Trần Lê đầu năm',
                'mo_ta' => 'Gặp gỡ, chúc tết và bàn bạc các kế hoạch của dòng họ',
                'ngay_duong' => $now->copy()->addMonths(1)->format('Y-m-d'),
                'ngay_am' => null,
                'dia_diem' => 'Nhà trưởng tộc Trần Lê Kỷ',
                'loai_su_kien' => 'hop_dong_ho',
                'lap_lai_hang_nam' => false,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 2,
                'ten_su_kien' => 'Lễ Thanh Minh dòng họ Trần Lê',
                'mo_ta' => 'Tảo mộ và dọn dẹp lăng mộ cụ tổ Trần Lê Phúc và các cụ đời trước',
                'ngay_duong' => $now->copy()->addMonths(2)->format('Y-m-d'),
                'ngay_am' => null,
                'dia_diem' => 'Nghĩa trang dòng họ Trần Lê',
                'loai_su_kien' => 'khac',
                'lap_lai_hang_nam' => true,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 2,
                'ten_su_kien' => 'Đầy tháng cháu Trần Lê Minh Khôi',
                'mo_ta' => 'Mừng đầy tháng cháu đích tôn dòng họ, con trai Trần Lê Gia Bảo',
                'ngay_duong' => $now->copy()->addDays(5)->format('Y-m-d'),
                'ngay_am' => null,
                'dia_diem' => 'Nhà anh Gia Bảo, Hà Nội',
                'loai_su_kien' => 'khac',
                'lap_lai_hang_nam' => false,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 2,
                'ten_su_kien' => 'Trao quỹ khuyến học họ Trần Lê',
                'mo_ta' => 'Trao phần thưởng cho các cháu đạt học sinh giỏi, đỗ đại học',
                'ngay_duong' => $now->copy()->addMonths(3)->format('Y-m-d'),
                'ngay_am' => null,
                'dia_diem' => 'Từ đường Trần Lê',
                'loai_su_kien' => 'khuyen_hoc',
                'lap_lai_hang_nam' => true,
                'created_at' => now(), 'updated_at' => now(),
            ],
        ]);
    }
}
