<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ThanhVienSeeder extends Seeder
{
    public function run(): void
    {
        // Làm sạch trước khi seed nếu cần (tuỳ chọn)
        
        // ==========================================
        // DÒNG HỌ 2: TRẦN LÊ (Dòng họ chính để test 5 đời)
        // ==========================================
        
        // --- Đời 1: Cụ Cố ---
        DB::table('thanh_viens')->insert([
            [
                'dong_ho_id' => 2,
                'ho_ten' => 'Trần Lê Phúc',
                'gioi_tinh' => 'nam',
                'doi_thu' => 1,
                'thu_tu_sinh' => 1,
                'ngay_sinh_duong' => '1900-01-01',
                'tinh_trang_song' => 0,
                'ngay_mat_am' => '1980-05-15',
                'tieu_su' => 'Cụ tổ khởi nghiệp của dòng họ Trần Lê',
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 2,
                'ho_ten' => 'Nguyễn Thị Mai',
                'gioi_tinh' => 'nu',
                'doi_thu' => 1,
                'thu_tu_sinh' => 1,
                'ngay_sinh_duong' => '1905-02-10',
                'tinh_trang_song' => 0,
                'ngay_mat_am' => '1985-08-20',
                'tieu_su' => 'Cụ bà, vợ cụ Trần Lê Phúc',
                'created_at' => now(), 'updated_at' => now(),
            ]
        ]);

        // --- Đời 2: Ông Bà ---
        DB::table('thanh_viens')->insert([
            [
                'dong_ho_id' => 2,
                'ho_ten' => 'Trần Lê Thọ',
                'gioi_tinh' => 'nam',
                'doi_thu' => 2,
                'thu_tu_sinh' => 1,
                'ngay_sinh_duong' => '1930-04-12',
                'tinh_trang_song' => 0,
                'ngay_mat_am' => '2005-10-10',
                'tieu_su' => 'Ông nội, con trai trưởng của cụ Phúc',
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 2,
                'ho_ten' => 'Phạm Thị Hoa',
                'gioi_tinh' => 'nu',
                'doi_thu' => 2,
                'thu_tu_sinh' => 1,
                'ngay_sinh_duong' => '1935-11-20',
                'tinh_trang_song' => 1,
                'ngay_mat_am' => null,
                'tieu_su' => 'Bà nội, vợ ông Thọ (hiện còn sống)',
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 2,
                'ho_ten' => 'Trần Lê Khang',
                'gioi_tinh' => 'nam',
                'doi_thu' => 2,
                'thu_tu_sinh' => 2,
                'ngay_sinh_duong' => '1935-06-15',
                'tinh_trang_song' => 0,
                'ngay_mat_am' => '2010-12-05',
                'tieu_su' => 'Ông trẻ, con trai thứ của cụ Phúc',
                'created_at' => now(), 'updated_at' => now(),
            ]
        ]);

        // --- Đời 3: Cha Mẹ, Cô Chú ---
        DB::table('thanh_viens')->insert([
            [
                'dong_ho_id' => 2,
                'ho_ten' => 'Trần Lê Kỷ',
                'gioi_tinh' => 'nam',
                'doi_thu' => 3,
                'thu_tu_sinh' => 1,
                'ngay_sinh_duong' => '1960-12-10',
                'tinh_trang_song' => 1,
                'ngay_mat_am' => null,
                'tieu_su' => 'Trưởng tộc Trần Lê hiện tại, con ông Thọ',
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 2,
                'ho_ten' => 'Lê Thị Cúc',
                'gioi_tinh' => 'nu',
                'doi_thu' => 3,
                'thu_tu_sinh' => 1,
                'ngay_sinh_duong' => '1962-09-05',
                'tinh_trang_song' => 1,
                'ngay_mat_am' => null,
                'tieu_su' => 'Vợ của Trưởng tộc Trần Lê Kỷ',
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 2,
                'ho_ten' => 'Trần Lê Cường',
                'gioi_tinh' => 'nam',
                'doi_thu' => 3,
                'thu_tu_sinh' => 2,
                'ngay_sinh_duong' => '1965-03-25',
                'tinh_trang_song' => 1,
                'ngay_mat_am' => null,
                'tieu_su' => 'Chú Cường, em trai của Trần Lê Kỷ',
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 2,
                'ho_ten' => 'Trần Thị Thu',
                'gioi_tinh' => 'nu',
                'doi_thu' => 3,
                'thu_tu_sinh' => 3,
                'ngay_sinh_duong' => '1968-07-20',
                'tinh_trang_song' => 0,
                'ngay_mat_am' => '2015-04-10',
                'tieu_su' => 'Cô Thu, em gái út (đã mất)',
                'created_at' => now(), 'updated_at' => now(),
            ]
        ]);

        // --- Đời 4: Con Cháu ---
        DB::table('thanh_viens')->insert([
            [
                'dong_ho_id' => 2,
                'ho_ten' => 'Trần Lê Gia Bảo',
                'gioi_tinh' => 'nam',
                'doi_thu' => 4,
                'thu_tu_sinh' => 1,
                'ngay_sinh_duong' => '1995-03-20',
                'tinh_trang_song' => 1,
                'ngay_mat_am' => null,
                'tieu_su' => 'Con trai trưởng của Trần Lê Kỷ',
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 2,
                'ho_ten' => 'Hoàng Thị Ngọc',
                'gioi_tinh' => 'nu',
                'doi_thu' => 4,
                'thu_tu_sinh' => 1,
                'ngay_sinh_duong' => '1996-05-12',
                'tinh_trang_song' => 1,
                'ngay_mat_am' => null,
                'tieu_su' => 'Vợ của Gia Bảo',
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 2,
                'ho_ten' => 'Trần Lê Minh Anh',
                'gioi_tinh' => 'nu',
                'doi_thu' => 4,
                'thu_tu_sinh' => 2,
                'ngay_sinh_duong' => '1998-07-15',
                'tinh_trang_song' => 1,
                'ngay_mat_am' => null,
                'tieu_su' => 'Con gái thứ của Trần Lê Kỷ',
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 2,
                'ho_ten' => 'Trần Lê Tuấn',
                'gioi_tinh' => 'nam',
                'doi_thu' => 4,
                'thu_tu_sinh' => 1,
                'ngay_sinh_duong' => '1990-08-30',
                'tinh_trang_song' => 1,
                'ngay_mat_am' => null,
                'tieu_su' => 'Con trai của chú Cường',
                'created_at' => now(), 'updated_at' => now(),
            ]
        ]);

        // --- Đời 5: Chắt ---
        DB::table('thanh_viens')->insert([
            [
                'dong_ho_id' => 2,
                'ho_ten' => 'Trần Lê Minh Khôi',
                'gioi_tinh' => 'nam',
                'doi_thu' => 5,
                'thu_tu_sinh' => 1,
                'ngay_sinh_duong' => '2020-09-09',
                'tinh_trang_song' => 1,
                'ngay_mat_am' => null,
                'tieu_su' => 'Cháu nội đích tôn, con trai Gia Bảo',
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 2,
                'ho_ten' => 'Trần Lê Bảo Ngọc',
                'gioi_tinh' => 'nu',
                'doi_thu' => 5,
                'thu_tu_sinh' => 2,
                'ngay_sinh_duong' => '2023-11-11',
                'tinh_trang_song' => 1,
                'ngay_mat_am' => null,
                'tieu_su' => 'Cháu gái, con gái Gia Bảo',
                'created_at' => now(), 'updated_at' => now(),
            ]
        ]);


        // ==========================================
        // DÒNG HỌ 1: NGUYỄN BÁ (Tối giản)
        // ==========================================
        $idOngNoi1 = DB::table('thanh_viens')->insertGetId(['dong_ho_id' => 1, 'ho_ten' => 'Nguyễn Bá Đạo', 'gioi_tinh' => 'nam', 'doi_thu' => 1, 'ngay_sinh_duong' => '1950-01-01', 'tinh_trang_song' => 0, 'created_at' => now(), 'updated_at' => now()]);
        $idBaNoi1 = DB::table('thanh_viens')->insertGetId(['dong_ho_id' => 1, 'ho_ten' => 'Trần Thị Nhàn', 'gioi_tinh' => 'nu', 'doi_thu' => 1, 'ngay_sinh_duong' => '1955-02-15', 'tinh_trang_song' => 1, 'created_at' => now(), 'updated_at' => now()]);
        $idCha1 = DB::table('thanh_viens')->insertGetId(['dong_ho_id' => 1, 'ho_ten' => 'Nguyễn Bá Bình', 'gioi_tinh' => 'nam', 'doi_thu' => 2, 'ngay_sinh_duong' => '1975-08-20', 'tinh_trang_song' => 1, 'created_at' => now(), 'updated_at' => now()]);
        $idCon1 = DB::table('thanh_viens')->insertGetId(['dong_ho_id' => 1, 'ho_ten' => 'Nguyễn Bá Cường', 'gioi_tinh' => 'nam', 'doi_thu' => 3, 'ngay_sinh_duong' => '2000-10-25', 'tinh_trang_song' => 1, 'created_at' => now(), 'updated_at' => now()]);
        $idConGai1 = DB::table('thanh_viens')->insertGetId(['dong_ho_id' => 1, 'ho_ten' => 'Nguyễn Thị Lan', 'gioi_tinh' => 'nu', 'doi_thu' => 3, 'ngay_sinh_duong' => '2005-05-05', 'tinh_trang_song' => 1, 'created_at' => now(), 'updated_at' => now()]);

    }
}
