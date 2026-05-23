<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ComplexClanSeeder extends Seeder
{
    public function run(): void
    {
        $clans = [
            3 => ['name' => 'Nguyễn Văn', 'email' => 'quanlynguyenvan@gmail.com'],
            4 => ['name' => 'Trương Thị', 'email' => 'quanlytruongthi@gmail.com'],
            5 => ['name' => 'Lê Hữu', 'email' => 'quanlylehuu@gmail.com'],
            6 => ['name' => 'Phạm Vũ', 'email' => 'quanlyphamvu@gmail.com'],
            7 => ['name' => 'Hoàng Ngô', 'email' => 'quanlyhoangngo@gmail.com'],
        ];

        foreach ($clans as $dongHoId => $clanInfo) {
            $ho = $clanInfo['name'];
            $now = Carbon::now();

            // 1. NGƯỜI DÙNG (Tài khoản)
            DB::table('nguoi_dungs')->insert([
                [
                    'dong_ho_id' => $dongHoId,
                    'ho_ten' => $ho . ' Trưởng Tộc',
                    'email' => Str::slug($ho . ' Trưởng Tộc', '') . '@gmail.com',
                    'password' => Hash::make('111111'),
                    'quyen_han' => 'quan_ly',
                    'created_at' => now(), 'updated_at' => now(),
                ],
                [
                    'dong_ho_id' => $dongHoId,
                    'ho_ten' => $ho . ' Thành Viên 1',
                    'email' => Str::slug($ho . ' Thành Viên 1', '') . '@gmail.com',
                    'password' => Hash::make('111111'),
                    'quyen_han' => 'thanh_vien',
                    'created_at' => now(), 'updated_at' => now(),
                ],
            ]);

            // 2. THÀNH VIÊN (5 đời)
            // Đời 1: Cụ Cố
            $idDoi1Nam = DB::table('thanh_viens')->insertGetId([
                'dong_ho_id' => $dongHoId, 'ho_ten' => $ho . ' Cụ Tổ', 'gioi_tinh' => 'nam',
                'doi_thu' => 1, 'thu_tu_sinh' => 1, 'ngay_sinh_duong' => '1890-01-01', 'ngay_mat_am' => '1950-01-01',
                'tinh_trang_song' => 0, 'created_at' => now(), 'updated_at' => now(),
            ]);
            $idDoi1Nu = DB::table('thanh_viens')->insertGetId([
                'dong_ho_id' => $dongHoId, 'ho_ten' => 'Vợ Cụ Tổ', 'gioi_tinh' => 'nu',
                'doi_thu' => 1, 'thu_tu_sinh' => 1, 'ngay_sinh_duong' => '1895-01-01', 'ngay_mat_am' => '1960-01-01',
                'tinh_trang_song' => 0, 'created_at' => now(), 'updated_at' => now(),
            ]);

            // Đời 2: Ông Bà
            $idDoi2Nam = DB::table('thanh_viens')->insertGetId([
                'dong_ho_id' => $dongHoId, 'ho_ten' => $ho . ' Ông Nội', 'gioi_tinh' => 'nam',
                'doi_thu' => 2, 'thu_tu_sinh' => 1, 'ngay_sinh_duong' => '1930-01-01', 'ngay_mat_am' => '2000-01-01',
                'tinh_trang_song' => 0, 'created_at' => now(), 'updated_at' => now(),
            ]);
            $idDoi2Nu = DB::table('thanh_viens')->insertGetId([
                'dong_ho_id' => $dongHoId, 'ho_ten' => 'Vợ Ông Nội', 'gioi_tinh' => 'nu',
                'doi_thu' => 2, 'thu_tu_sinh' => 1, 'ngay_sinh_duong' => '1935-01-01', 'ngay_mat_am' => '2010-01-01',
                'tinh_trang_song' => 0, 'created_at' => now(), 'updated_at' => now(),
            ]);

            // Đời 3: Các Con (Trưởng Tộc)
            $idDoi3Nam = DB::table('thanh_viens')->insertGetId([
                'dong_ho_id' => $dongHoId, 'ho_ten' => $ho . ' Trưởng Tộc', 'gioi_tinh' => 'nam',
                'doi_thu' => 3, 'thu_tu_sinh' => 1, 'ngay_sinh_duong' => '1960-01-01', 'ngay_mat_am' => null,
                'tinh_trang_song' => 1, 'created_at' => now(), 'updated_at' => now(),
            ]);
            $idDoi3Nu = DB::table('thanh_viens')->insertGetId([
                'dong_ho_id' => $dongHoId, 'ho_ten' => 'Vợ Trưởng Tộc', 'gioi_tinh' => 'nu',
                'doi_thu' => 3, 'thu_tu_sinh' => 1, 'ngay_sinh_duong' => '1965-01-01', 'ngay_mat_am' => null,
                'tinh_trang_song' => 1, 'created_at' => now(), 'updated_at' => now(),
            ]);

            // Đời 4: Các Cháu
            $idDoi4Nam = DB::table('thanh_viens')->insertGetId([
                'dong_ho_id' => $dongHoId, 'ho_ten' => $ho . ' Cháu Đích Tôn', 'gioi_tinh' => 'nam',
                'doi_thu' => 4, 'thu_tu_sinh' => 1, 'ngay_sinh_duong' => '1990-01-01', 'ngay_mat_am' => null,
                'tinh_trang_song' => 1, 'created_at' => now(), 'updated_at' => now(),
            ]);

            // Đời 5: Các Chắt
            $idDoi5Nam = DB::table('thanh_viens')->insertGetId([
                'dong_ho_id' => $dongHoId, 'ho_ten' => $ho . ' Chắt Đích Tôn', 'gioi_tinh' => 'nam',
                'doi_thu' => 5, 'thu_tu_sinh' => 1, 'ngay_sinh_duong' => '2020-01-01', 'ngay_mat_am' => null,
                'tinh_trang_song' => 1, 'created_at' => now(), 'updated_at' => now(),
            ]);

            // 3. QUAN HỆ
            DB::table('quan_hes')->insert([
                // Vợ chồng
                ['node_1_id' => $idDoi1Nam, 'node_2_id' => $idDoi1Nu, 'loai_quan_he' => 'vo_chong', 'created_at' => now(), 'updated_at' => now()],
                ['node_1_id' => $idDoi2Nam, 'node_2_id' => $idDoi2Nu, 'loai_quan_he' => 'vo_chong', 'created_at' => now(), 'updated_at' => now()],
                ['node_1_id' => $idDoi3Nam, 'node_2_id' => $idDoi3Nu, 'loai_quan_he' => 'vo_chong', 'created_at' => now(), 'updated_at' => now()],
                // Cha con
                ['node_1_id' => $idDoi1Nam, 'node_2_id' => $idDoi2Nam, 'loai_quan_he' => 'cha_con', 'created_at' => now(), 'updated_at' => now()],
                ['node_1_id' => $idDoi2Nam, 'node_2_id' => $idDoi3Nam, 'loai_quan_he' => 'cha_con', 'created_at' => now(), 'updated_at' => now()],
                ['node_1_id' => $idDoi3Nam, 'node_2_id' => $idDoi4Nam, 'loai_quan_he' => 'cha_con', 'created_at' => now(), 'updated_at' => now()],
                ['node_1_id' => $idDoi4Nam, 'node_2_id' => $idDoi5Nam, 'loai_quan_he' => 'cha_con', 'created_at' => now(), 'updated_at' => now()],
            ]);

            // 4. SỰ KIỆN
            DB::table('su_kiens')->insert([
                [
                    'dong_ho_id' => $dongHoId,
                    'ten_su_kien' => 'Giỗ Cụ Tổ ' . $ho,
                    'mo_ta' => 'Lễ giỗ cụ tổ khởi nghiệp dòng họ ' . $ho,
                    'ngay_duong' => $now->copy()->addDays(3)->format('Y-m-d'),
                    'ngay_am' => $now->copy()->addDays(3)->subMonths(1)->format('Y-m-d'),
                    'dia_diem' => 'Từ đường ' . $ho,
                    'loai_su_kien' => 'le_gio',
                    'lap_lai_hang_nam' => true,
                    'created_at' => now(), 'updated_at' => now(),
                ],
                [
                    'dong_ho_id' => $dongHoId,
                    'ten_su_kien' => 'Đầy tháng chắt ' . $ho,
                    'mo_ta' => 'Mừng đầy tháng chắt đích tôn dòng họ',
                    'ngay_duong' => $now->copy()->addDays(7)->format('Y-m-d'),
                    'ngay_am' => null,
                    'dia_diem' => 'Nhà Trưởng Tộc',
                    'loai_su_kien' => 'khac',
                    'lap_lai_hang_nam' => false,
                    'created_at' => now(), 'updated_at' => now(),
                ]
            ]);

            // 5. TÀI LIỆU
            DB::table('tai_lieus')->insert([
                [
                    'thanh_vien_id' => null,
                    'dong_ho_id' => $dongHoId,
                    'duong_dan_file' => 'uploads/documents/gia_pha_' . Str::slug($ho) . '.pdf',
                    'loai_file' => 'pdf',
                    'du_lieu_orc' => 'Bản scan cuốn gia phả họ ' . $ho,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'thanh_vien_id' => null,
                    'dong_ho_id' => $dongHoId,
                    'duong_dan_file' => 'uploads/images/tu_duong_' . Str::slug($ho) . '.jpg',
                    'loai_file' => 'hinh_anh',
                    'du_lieu_orc' => 'Ảnh mặt trước nhà thờ tổ dòng họ ' . $ho,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            ]);
        }
    }
}
