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
            [
                'dong_ho_id' => 1,
                'ten_su_kien' => 'Lễ Thanh Minh - Tảo mộ dòng họ',
                'mo_ta' => 'Con cháu tập trung ra khu mộ tổ để dọn dẹp, thắp hương tri ân tổ tiên',
                'ngay_duong' => '2024-04-04',
                'ngay_am' => '2024-02-26',
                'dia_diem' => 'Nghĩa trang dòng họ Nguyễn Bá',
                'loai_su_kien' => 'khac',
                'lap_lai_hang_nam' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 1,
                'ten_su_kien' => 'Lễ báo công con cháu đỗ đạt K26',
                'mo_ta' => 'Vinh danh các cháu vừa đỗ đại học và có thành tích xuất sắc trong năm học 2025-2026',
                'ngay_duong' => '2026-08-20',
                'ngay_am' => '2026-07-08',
                'dia_diem' => 'Nhà thờ tổ Nguyễn Bá',
                'loai_su_kien' => 'khuyen_hoc',
                'lap_lai_hang_nam' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 1,
                'ten_su_kien' => 'Đại hội đại biểu dòng họ nhiệm kỳ mới',
                'mo_ta' => 'Bầu ra ban quản trị dòng họ mới để điều hành các hoạt động chung',
                'ngay_duong' => '2026-01-10',
                'ngay_am' => '2025-12-11',
                'dia_diem' => 'Nhà văn hóa thôn',
                'loai_su_kien' => 'hop_dong_ho',
                'lap_lai_hang_nam' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 1,
                'ten_su_kien' => 'Lễ tất niên và phát quà Tết',
                'mo_ta' => 'Tổng kết năm cũ, tặng quà Tết cho các hộ gia đình khó khăn trong dòng họ',
                'ngay_duong' => '2026-02-06',
                'ngay_am' => '2025-12-28',
                'dia_diem' => 'Nhà thờ tổ Nguyễn Bá',
                'loai_su_kien' => 'hop_dong_ho',
                'lap_lai_hang_nam' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 1,
                'ten_su_kien' => 'Ngày giỗ Chi 2 (Nhánh ông Nguyễn Bá Bình)',
                'mo_ta' => 'Ngày giỗ nội bộ chi 2, tưởng nhớ các bậc tiền nhân của nhánh',
                'ngay_duong' => '2026-11-15',
                'ngay_am' => '2026-10-06',
                'dia_diem' => 'Nhà riêng trưởng chi 2',
                'loai_su_kien' => 'le_gio',
                'lap_lai_hang_nam' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
