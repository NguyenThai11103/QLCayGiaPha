<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CacheXungHoSeeder extends Seeder
{
    public function run(): void
    {
        // Làm sạch bảng trước khi chạy
        DB::table('cache_xung_ho')->truncate();

        DB::table('cache_xung_ho')->insert([
            // --- QUAN HỆ TRỰC HỆ (ÔNG - CHÁU) ---
            [
                'dong_ho_id'       => 1,
                'nguoi_goi_id'     => 1, // Nguyễn Bá Đạo
                'nguoi_nghe_id'    => 4, // Nguyễn Bá Cường
                'danh_xung_a'      => 'Ông nội',
                'danh_xung_b'      => 'Cháu đích tôn',
                'khoang_cach_doi'  => 2,
                'pattern_duong_di' => 'cha_con.cha_con',
                'created_at'       => now(), 'updated_at' => now(),
            ],
            [
                'dong_ho_id'       => 1,
                'nguoi_goi_id'     => 4, // Cường gọi lại cụ Đạo
                'nguoi_nghe_id'    => 1,
                'danh_xung_a'      => 'Cháu',
                'danh_xung_b'      => 'Ông nội',
                'khoang_cach_doi'  => -2,
                'pattern_duong_di' => 'con_cha.con_cha',
                'created_at'       => now(), 'updated_at' => now(),
            ],

            // --- QUAN HỆ CHA - CON ---
            [
                'dong_ho_id'       => 1,
                'nguoi_goi_id'     => 3, // Nguyễn Bá Bình
                'nguoi_nghe_id'    => 4, // Nguyễn Bá Cường
                'danh_xung_a'      => 'Cha',
                'danh_xung_b'      => 'Con trai',
                'khoang_cach_doi'  => 1,
                'pattern_duong_di' => 'cha_con',
                'created_at'       => now(), 'updated_at' => now(),
            ],
            [
                'dong_ho_id'       => 1,
                'nguoi_goi_id'     => 3, // Nguyễn Bá Bình
                'nguoi_nghe_id'    => 5, // Nguyễn Thị Lan
                'danh_xung_a'      => 'Cha',
                'danh_xung_b'      => 'Con gái',
                'khoang_cach_doi'  => 1,
                'pattern_duong_di' => 'cha_con',
                'created_at'       => now(), 'updated_at' => now(),
            ],

            // --- QUAN HỆ ANH - EM (NGANG HÀNG) ---
            [
                'dong_ho_id'       => 1,
                'nguoi_goi_id'     => 4, // Cường
                'nguoi_nghe_id'    => 5, // Lan
                'danh_xung_a'      => 'Anh trai',
                'danh_xung_b'      => 'Em gái',
                'khoang_cach_doi'  => 0,
                'pattern_duong_di' => 'cung_cha_me',
                'created_at'       => now(), 'updated_at' => now(),
            ],

            // --- QUAN HỆ PHU THÊ (VỢ CHỒNG) ---
            [
                'dong_ho_id'       => 1,
                'nguoi_goi_id'     => 2, // Trần Thị Nhàn
                'nguoi_nghe_id'    => 1, // Nguyễn Bá Đạo
                'danh_xung_a'      => 'Vợ',
                'danh_xung_b'      => 'Chồng',
                'khoang_cach_doi'  => 0,
                'pattern_duong_di' => 'phu_the',
                'created_at'       => now(), 'updated_at' => now(),
            ],

            // --- QUAN HỆ BÀ - CHÁU ---
            [
                'dong_ho_id'       => 1,
                'nguoi_goi_id'     => 2, // Bà Nhàn
                'nguoi_nghe_id'    => 5, // Cháu Lan
                'danh_xung_a'      => 'Bà nội',
                'danh_xung_b'      => 'Cháu gái',
                'khoang_cach_doi'  => 2,
                'pattern_duong_di' => 'me_con.cha_con',
                'created_at'       => now(), 'updated_at' => now(),
            ],
        ]);
    }
}