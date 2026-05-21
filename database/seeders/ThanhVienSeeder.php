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
            'tinh_trang_song' => 'mat',
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
            'tinh_trang_song' => 'song',
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
            'tinh_trang_song' => 'song',
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
            'tinh_trang_song' => 'song',
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
            'tinh_trang_song' => 'song',
            'nghe_nghiep' => 'Sinh viên',
            'cho_o_hien_tai' => 'Hà Nội',
            'tieu_su' => 'Con gái út của ông Bình.',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        // --- BỔ SUNG THÊM DỮ LIỆU ---

        // Vợ ông Nguyễn Bá Bình (Thế hệ 2)
        $idVoCha = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id' => 1,
            'ho_ten' => 'Lê Thị Hồng',
            'gioi_tinh' => 'nu',
            'doi_thu' => 2,
            'ngay_sinh_duong' => '1978-05-12',
            'tinh_trang_song' => 1,
            'nghe_nghiep' => 'Giáo viên',
            'cho_o_hien_tai' => 'Bắc Ninh',
            'tieu_su' => 'Vợ của ông Nguyễn Bá Bình',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Em trai ông Nguyễn Bá Bình (Thế hệ 2)
        $idChu = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id' => 1,
            'ho_ten' => 'Nguyễn Bá Sơn',
            'gioi_tinh' => 'nam',
            'doi_thu' => 2,
            'thu_tu_sinh' => 2,
            'ngay_sinh_duong' => '1980-04-15',
            'tinh_trang_song' => 1,
            'nghe_nghiep' => 'Kỹ sư xây dựng',
            'cho_o_hien_tai' => 'Hà Nội',
            'tieu_su' => 'Con trai thứ hai của ông Nguyễn Bá Đạo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Vợ ông Nguyễn Bá Sơn (Thế hệ 2)
        $idThim = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id' => 1,
            'ho_ten' => 'Vũ Thị Mai',
            'gioi_tinh' => 'nu',
            'doi_thu' => 2,
            'ngay_sinh_duong' => '1983-09-20',
            'tinh_trang_song' => 1,
            'nghe_nghiep' => 'Kế toán',
            'cho_o_hien_tai' => 'Hà Nội',
            'tieu_su' => 'Vợ của ông Nguyễn Bá Sơn',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Em gái ông Nguyễn Bá Bình (Thế hệ 2)
        $idCo = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id' => 1,
            'ho_ten' => 'Nguyễn Thị Hoa',
            'gioi_tinh' => 'nu',
            'doi_thu' => 2,
            'thu_tu_sinh' => 3,
            'ngay_sinh_duong' => '1985-11-30',
            'tinh_trang_song' => 1,
            'nghe_nghiep' => 'Bác sĩ',
            'cho_o_hien_tai' => 'Hải Phòng',
            'tieu_su' => 'Con gái út của ông Nguyễn Bá Đạo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Chồng bà Nguyễn Thị Hoa (Thế hệ 2)
        $idDuong = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id' => 1,
            'ho_ten' => 'Trần Văn Hùng',
            'gioi_tinh' => 'nam',
            'doi_thu' => 2,
            'ngay_sinh_duong' => '1982-03-10',
            'tinh_trang_song' => 1,
            'nghe_nghiep' => 'Kinh doanh',
            'cho_o_hien_tai' => 'Hải Phòng',
            'tieu_su' => 'Chồng của bà Nguyễn Thị Hoa',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Vợ ông Nguyễn Bá Cường (Thế hệ 3)
        $idVoCon = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id' => 1,
            'ho_ten' => 'Phạm Thị Thảo',
            'gioi_tinh' => 'nu',
            'doi_thu' => 3,
            'ngay_sinh_duong' => '2002-08-18',
            'tinh_trang_song' => 1,
            'nghe_nghiep' => 'Nhân viên văn phòng',
            'cho_o_hien_tai' => 'Hà Nội',
            'tieu_su' => 'Vợ của ông Nguyễn Bá Cường',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Con trai ông Nguyễn Bá Sơn (Thế hệ 3)
        $idConChu1 = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id' => 1,
            'ho_ten' => 'Nguyễn Bá Hoàng',
            'gioi_tinh' => 'nam',
            'doi_thu' => 3,
            'thu_tu_sinh' => 1,
            'ngay_sinh_duong' => '2008-06-12',
            'tinh_trang_song' => 1,
            'nghe_nghiep' => 'Học sinh',
            'cho_o_hien_tai' => 'Hà Nội',
            'tieu_su' => 'Con trai lớn của ông Nguyễn Bá Sơn',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Con gái ông Nguyễn Bá Sơn (Thế hệ 3)
        $idConChu2 = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id' => 1,
            'ho_ten' => 'Nguyễn Thị Minh',
            'gioi_tinh' => 'nu',
            'doi_thu' => 3,
            'thu_tu_sinh' => 2,
            'ngay_sinh_duong' => '2012-09-05',
            'tinh_trang_song' => 1,
            'nghe_nghiep' => 'Học sinh',
            'cho_o_hien_tai' => 'Hà Nội',
            'tieu_su' => 'Con gái út của ông Nguyễn Bá Sơn',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Con trai bà Nguyễn Thị Hoa (Thế hệ 3)
        $idConCo = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id' => 1,
            'ho_ten' => 'Trần Nguyễn Tuấn',
            'gioi_tinh' => 'nam',
            'doi_thu' => 3,
            'thu_tu_sinh' => 1,
            'ngay_sinh_duong' => '2010-01-22',
            'tinh_trang_song' => 1,
            'nghe_nghiep' => 'Học sinh',
            'cho_o_hien_tai' => 'Hải Phòng',
            'tieu_su' => 'Con trai của bà Nguyễn Thị Hoa',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Thế hệ 4 - Con trai ông Nguyễn Bá Cường
        $idChat = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id' => 1,
            'ho_ten' => 'Nguyễn Bá Khải',
            'gioi_tinh' => 'nam',
            'doi_thu' => 4,
            'thu_tu_sinh' => 1,
            'ngay_sinh_duong' => '2025-02-14',
            'tinh_trang_song' => 1,
            'tieu_su' => 'Chắt đích tôn của ông Nguyễn Bá Đạo, con trai của ông Nguyễn Bá Cường',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
