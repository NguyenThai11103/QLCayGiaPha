<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class QuanHeSeeder extends Seeder
{
    public function run(): void
    {
        // // 0. Làm sạch bảng quan hệ trước khi chạy
        // DB::table('quan_hes')->truncate();

        // 1. Lấy ID của các thành viên dựa theo họ tên từ bảng thanh_viens
        $idOngNoi = DB::table('thanh_viens')->where('ho_ten', 'Nguyễn Bá Đạo')->value('id');
        $idBaNoi  = DB::table('thanh_viens')->where('ho_ten', 'Trần Thị Nhàn')->value('id');
        $idCha    = DB::table('thanh_viens')->where('ho_ten', 'Nguyễn Bá Bình')->value('id');
        $idCon    = DB::table('thanh_viens')->where('ho_ten', 'Nguyễn Bá Cường')->value('id');
        $idConGai = DB::table('thanh_viens')->where('ho_ten', 'Nguyễn Thị Lan')->value('id');

        // 2. Thiết lập các mối quan hệ
        DB::table('quan_hes')->insert([
            // Quan hệ vợ chồng: Đạo - Nhàn
            [
                'node_1_id' => $idOngNoi, // Nguyễn Bá Đạo
                'node_2_id' => $idBaNoi,  // Trần Thị Nhàn
                'loai_quan_he' => 'vo_chong',
                'tinh_chat_quan_he' => null,
                'tinh_trang_hon_nhan' => 'dang_ket_hon',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Quan hệ Cha - Con: Đạo -> Bình
            [
                'node_1_id' => $idOngNoi, // Nguyễn Bá Đạo (Cha)
                'node_2_id' => $idCha,    // Nguyễn Bá Bình (Con)
                'loai_quan_he' => 'cha_con',
                'tinh_chat_quan_he' => 'ruot_thit',
                'tinh_trang_hon_nhan' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Quan hệ Mẹ - Con: Nhàn -> Bình
            [
                'node_1_id' => $idBaNoi,  // Trần Thị Nhàn (Mẹ)
                'node_2_id' => $idCha,    // Nguyễn Bá Bình (Con)
                'loai_quan_he' => 'me_con',
                'tinh_chat_quan_he' => 'ruot_thit',
                'tinh_trang_hon_nhan' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Quan hệ Cha - Con: Bình -> Cường
            [
                'node_1_id' => $idCha,    // Nguyễn Bá Bình (Cha)
                'node_2_id' => $idCon,    // Nguyễn Bá Cường (Con trai)
                'loai_quan_he' => 'cha_con',
                'tinh_chat_quan_he' => 'ruot_thit',
                'tinh_trang_hon_nhan' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Quan hệ Cha - Con: Bình -> Lan
            [
                'node_1_id' => $idCha,    // Nguyễn Bá Bình (Cha)
                'node_2_id' => $idConGai, // Nguyễn Thị Lan (Con gái)
                'loai_quan_he' => 'cha_con',
                'tinh_chat_quan_he' => 'ruot_thit',
                'tinh_trang_hon_nhan' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}