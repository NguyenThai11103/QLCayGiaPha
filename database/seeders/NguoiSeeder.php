<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class NguoiSeeder extends Seeder
{
    public function run(): void
    {
        // Thế hệ 1
        $idOngNoi = DB::table('nguois')->insertGetId([
            'id_dong_ho' => 1,
            'ten_day_du' => 'Nguyễn Bá Đạo',
            'gioi_tinh' => 'nam',
            'ngay_sinh' => '1950-01-01',
            'da_mat' => true,
            'ngay_mat' => '2020-05-10',
            'tieu_su' => 'Ông tổ đời thứ 3 của dòng họ',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        $idBaNoi = DB::table('nguois')->insertGetId([
            'id_dong_ho' => 1,
            'ten_day_du' => 'Trần Thị Nhàn',
            'gioi_tinh' => 'nu',
            'ngay_sinh' => '1955-02-15',
            'da_mat' => false,
            'tieu_su' => 'Vợ của ông Nguyễn Bá Đạo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Thế hệ 2
        $idCha = DB::table('nguois')->insertGetId([
            'id_dong_ho' => 1,
            'ten_day_du' => 'Nguyễn Bá Bình',
            'gioi_tinh' => 'nam',
            'ngay_sinh' => '1975-08-20',
            'da_mat' => false,
            'id_cha' => $idOngNoi,
            'id_me' => $idBaNoi,
            'tieu_su' => 'Con trai trưởng',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Thế hệ 3
        $idCon = DB::table('nguois')->insertGetId([
            'id_dong_ho' => 1,
            'ten_day_du' => 'Nguyễn Bá Cường',
            'gioi_tinh' => 'nam',
            'ngay_sinh' => '2000-10-25',
            'da_mat' => false,
            'id_cha' => $idCha,
            'tieu_su' => 'Cháu đích tôn',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $idConGai = DB::table('nguois')->insertGetId([
            'id_dong_ho' => 1,
            'ten_day_du' => 'Nguyễn Thị Hoa',
            'gioi_tinh' => 'nu',
            'ngay_sinh' => '2003-12-10',
            'da_mat' => false,
            'id_cha' => $idCha,
            'tieu_su' => 'Cháu gái',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Thế hệ 4
        $idChau = DB::table('nguois')->insertGetId([
            'id_dong_ho' => 1,
            'ten_day_du' => 'Nguyễn Bá Dũng',
            'gioi_tinh' => 'nam',
            'ngay_sinh' => '2022-05-15',
            'da_mat' => false,
            'id_cha' => $idCon,
            'tieu_su' => 'Chắt đích tôn',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Thế hệ 5
        $idChut = DB::table('nguois')->insertGetId([
            'id_dong_ho' => 1,
            'ten_day_du' => 'Nguyễn Bá Phát',
            'gioi_tinh' => 'nam',
            'ngay_sinh' => '2045-01-01',
            'da_mat' => false,
            'id_cha' => $idChau,
            'tieu_su' => 'Chút đích tôn',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Thế hệ 6
        DB::table('nguois')->insert([
            'id_dong_ho' => 1,
            'ten_day_du' => 'Nguyễn Bá Lộc',
            'gioi_tinh' => 'nam',
            'ngay_sinh' => '2068-08-08',
            'da_mat' => false,
            'id_cha' => $idChut,
            'tieu_su' => 'Chít đích tôn',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
