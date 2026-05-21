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

        // Bổ sung các thành viên mới
        $idVoCha   = DB::table('thanh_viens')->where('ho_ten', 'Lê Thị Hồng')->value('id');
        $idChu     = DB::table('thanh_viens')->where('ho_ten', 'Nguyễn Bá Sơn')->value('id');
        $idThim    = DB::table('thanh_viens')->where('ho_ten', 'Vũ Thị Mai')->value('id');
        $idCo      = DB::table('thanh_viens')->where('ho_ten', 'Nguyễn Thị Hoa')->value('id');
        $idDuong   = DB::table('thanh_viens')->where('ho_ten', 'Trần Văn Hùng')->value('id');
        $idVoCon   = DB::table('thanh_viens')->where('ho_ten', 'Phạm Thị Thảo')->value('id');
        $idConChu1 = DB::table('thanh_viens')->where('ho_ten', 'Nguyễn Bá Hoàng')->value('id');
        $idConChu2 = DB::table('thanh_viens')->where('ho_ten', 'Nguyễn Thị Minh')->value('id');
        $idConCo   = DB::table('thanh_viens')->where('ho_ten', 'Trần Nguyễn Tuấn')->value('id');
        $idChat    = DB::table('thanh_viens')->where('ho_ten', 'Nguyễn Bá Khải')->value('id');

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

            // --- BỔ SUNG QUAN HỆ MỚI ---

            // Quan hệ vợ chồng: Bình - Hồng
            [
                'node_1_id' => $idCha,
                'node_2_id' => $idVoCha,
                'loai_quan_he' => 'vo_chong',
                'tinh_chat_quan_he' => null,
                'tinh_trang_hon_nhan' => 'dang_ket_hon',
                'created_at' => now(), 'updated_at' => now(),
            ],
            // Quan hệ Mẹ - Con: Hồng -> Cường
            [
                'node_1_id' => $idVoCha,
                'node_2_id' => $idCon,
                'loai_quan_he' => 'me_con',
                'tinh_chat_quan_he' => 'ruot_thit',
                'tinh_trang_hon_nhan' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
            // Quan hệ Mẹ - Con: Hồng -> Lan
            [
                'node_1_id' => $idVoCha,
                'node_2_id' => $idConGai,
                'loai_quan_he' => 'me_con',
                'tinh_chat_quan_he' => 'ruot_thit',
                'tinh_trang_hon_nhan' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],

            // Quan hệ Cha - Con: Đạo -> Sơn
            [
                'node_1_id' => $idOngNoi,
                'node_2_id' => $idChu,
                'loai_quan_he' => 'cha_con',
                'tinh_chat_quan_he' => 'ruot_thit',
                'tinh_trang_hon_nhan' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
            // Quan hệ Mẹ - Con: Nhàn -> Sơn
            [
                'node_1_id' => $idBaNoi,
                'node_2_id' => $idChu,
                'loai_quan_he' => 'me_con',
                'tinh_chat_quan_he' => 'ruot_thit',
                'tinh_trang_hon_nhan' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
            // Quan hệ vợ chồng: Sơn - Mai
            [
                'node_1_id' => $idChu,
                'node_2_id' => $idThim,
                'loai_quan_he' => 'vo_chong',
                'tinh_chat_quan_he' => null,
                'tinh_trang_hon_nhan' => 'dang_ket_hon',
                'created_at' => now(), 'updated_at' => now(),
            ],
            // Quan hệ Cha - Con: Sơn -> Hoàng
            [
                'node_1_id' => $idChu,
                'node_2_id' => $idConChu1,
                'loai_quan_he' => 'cha_con',
                'tinh_chat_quan_he' => 'ruot_thit',
                'tinh_trang_hon_nhan' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
            // Quan hệ Mẹ - Con: Mai -> Hoàng
            [
                'node_1_id' => $idThim,
                'node_2_id' => $idConChu1,
                'loai_quan_he' => 'me_con',
                'tinh_chat_quan_he' => 'ruot_thit',
                'tinh_trang_hon_nhan' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
            // Quan hệ Cha - Con: Sơn -> Minh
            [
                'node_1_id' => $idChu,
                'node_2_id' => $idConChu2,
                'loai_quan_he' => 'cha_con',
                'tinh_chat_quan_he' => 'ruot_thit',
                'tinh_trang_hon_nhan' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
            // Quan hệ Mẹ - Con: Mai -> Minh
            [
                'node_1_id' => $idThim,
                'node_2_id' => $idConChu2,
                'loai_quan_he' => 'me_con',
                'tinh_chat_quan_he' => 'ruot_thit',
                'tinh_trang_hon_nhan' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],

            // Quan hệ Cha - Con: Đạo -> Hoa
            [
                'node_1_id' => $idOngNoi,
                'node_2_id' => $idCo,
                'loai_quan_he' => 'cha_con',
                'tinh_chat_quan_he' => 'ruot_thit',
                'tinh_trang_hon_nhan' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
            // Quan hệ Mẹ - Con: Nhàn -> Hoa
            [
                'node_1_id' => $idBaNoi,
                'node_2_id' => $idCo,
                'loai_quan_he' => 'me_con',
                'tinh_chat_quan_he' => 'ruot_thit',
                'tinh_trang_hon_nhan' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
            // Quan hệ vợ chồng: Hùng - Hoa
            [
                'node_1_id' => $idDuong,
                'node_2_id' => $idCo,
                'loai_quan_he' => 'vo_chong',
                'tinh_chat_quan_he' => null,
                'tinh_trang_hon_nhan' => 'dang_ket_hon',
                'created_at' => now(), 'updated_at' => now(),
            ],
            // Quan hệ Cha - Con: Hùng -> Tuấn
            [
                'node_1_id' => $idDuong,
                'node_2_id' => $idConCo,
                'loai_quan_he' => 'cha_con',
                'tinh_chat_quan_he' => 'ruot_thit',
                'tinh_trang_hon_nhan' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
            // Quan hệ Mẹ - Con: Hoa -> Tuấn
            [
                'node_1_id' => $idCo,
                'node_2_id' => $idConCo,
                'loai_quan_he' => 'me_con',
                'tinh_chat_quan_he' => 'ruot_thit',
                'tinh_trang_hon_nhan' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],

            // Quan hệ vợ chồng: Cường - Thảo
            [
                'node_1_id' => $idCon,
                'node_2_id' => $idVoCon,
                'loai_quan_he' => 'vo_chong',
                'tinh_chat_quan_he' => null,
                'tinh_trang_hon_nhan' => 'dang_ket_hon',
                'created_at' => now(), 'updated_at' => now(),
            ],
            // Quan hệ Cha - Con: Cường -> Khải
            [
                'node_1_id' => $idCon,
                'node_2_id' => $idChat,
                'loai_quan_he' => 'cha_con',
                'tinh_chat_quan_he' => 'ruot_thit',
                'tinh_trang_hon_nhan' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
            // Quan hệ Mẹ - Con: Thảo -> Khải
            [
                'node_1_id' => $idVoCon,
                'node_2_id' => $idChat,
                'loai_quan_he' => 'me_con',
                'tinh_chat_quan_he' => 'ruot_thit',
                'tinh_trang_hon_nhan' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
        ]);
    }
}