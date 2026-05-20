<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ThanhVienSeeder extends Seeder
{
    public function run(): void
    {
        // Thế hệ 1
        $idOngNoi = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id' => 1,
            'ho_ten' => 'Nguyễn Bá Đạo',
            'gioi_tinh' => 'nam',
            'doi_thu' => 1,
            'ngay_sinh_duong' => '1950-01-01',
            'tinh_trang_song' => 0,
            'ngay_mat_am' => '2020-05-10',
            'tieu_su' => 'Ông tổ đời thứ 1 của dòng họ',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        $idBaNoi = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id' => 1,
            'ho_ten' => 'Trần Thị Nhàn',
            'gioi_tinh' => 'nu',
            'doi_thu' => 1,
            'ngay_sinh_duong' => '1955-02-15',
            'tinh_trang_song' => 1,
            'tieu_su' => 'Vợ của ông Nguyễn Bá Đạo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Thế hệ 2
        $idCha = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id' => 1,
            'ho_ten' => 'Nguyễn Bá Bình',
            'gioi_tinh' => 'nam',
            'doi_thu' => 2,
            'thu_tu_sinh' => 1,
            'ngay_sinh_duong' => '1975-08-20',
            'tinh_trang_song' => 1,
            'tieu_su' => 'Con trai trưởng',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Thế hệ 3
        $idCon = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id' => 1,
            'ho_ten' => 'Nguyễn Bá Cường',
            'gioi_tinh' => 'nam',
            'doi_thu' => 3,
            'thu_tu_sinh' => 1,
            'ngay_sinh_duong' => '2000-10-25',
            'tinh_trang_song' => 1,
            'tieu_su' => 'Cháu đích tôn',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        // 2. Cháu gái
        $idConGai = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id' => 1,
            'ho_ten' => 'Nguyễn Thị Lan',
            'ten_thuong_goi' => 'Lan',
            'gioi_tinh' => 'nu',
            'doi_thu' => 3,
            'thu_tu_sinh' => 2,
            'ngay_sinh_duong' => '2005-05-05',
            'tinh_trang_song' => 1,
            'nghe_nghiep' => 'Sinh viên',
            'cho_o_hien_tai' => 'Hà Nội',
            'tieu_su' => 'Con gái út của ông Bình.',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        
    }
}
