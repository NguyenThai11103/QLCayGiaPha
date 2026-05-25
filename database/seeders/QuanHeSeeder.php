<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class QuanHeSeeder extends Seeder
{
    public function run(): void
    {
        // ---------------------------------------------------------
        // DÒNG HỌ 2: TRẦN LÊ (Dòng họ chính)
        // ---------------------------------------------------------
        $tv2 = DB::table('thanh_viens')->where('dong_ho_id', 2)->pluck('id', 'ho_ten');

        $quanHes = [];

        // Đời 1: Vợ chồng cụ Phúc - Mai
        if (isset($tv2['Trần Lê Phúc']) && isset($tv2['Nguyễn Thị Mai'])) {
            $quanHes[] = ['node_1_id' => $tv2['Trần Lê Phúc'], 'node_2_id' => $tv2['Nguyễn Thị Mai'], 'loai_quan_he' => 'vo_chong', 'tinh_chat_quan_he' => null, 'tinh_trang_hon_nhan' => 'dang_ket_hon', 'created_at' => now(), 'updated_at' => now()];
        }

        // Đời 1 -> Đời 2: Con của cụ Phúc
        if (isset($tv2['Trần Lê Phúc'])) {
            if (isset($tv2['Trần Lê Thọ'])) $quanHes[] = ['node_1_id' => $tv2['Trần Lê Phúc'], 'node_2_id' => $tv2['Trần Lê Thọ'], 'loai_quan_he' => 'cha_con', 'tinh_chat_quan_he' => 'ruot_thit', 'tinh_trang_hon_nhan' => null, 'created_at' => now(), 'updated_at' => now()];
            if (isset($tv2['Trần Lê Khang'])) $quanHes[] = ['node_1_id' => $tv2['Trần Lê Phúc'], 'node_2_id' => $tv2['Trần Lê Khang'], 'loai_quan_he' => 'cha_con', 'tinh_chat_quan_he' => 'ruot_thit', 'tinh_trang_hon_nhan' => null, 'created_at' => now(), 'updated_at' => now()];
        }
        if (isset($tv2['Nguyễn Thị Mai'])) {
            if (isset($tv2['Trần Lê Thọ'])) $quanHes[] = ['node_1_id' => $tv2['Nguyễn Thị Mai'], 'node_2_id' => $tv2['Trần Lê Thọ'], 'loai_quan_he' => 'me_con', 'tinh_chat_quan_he' => 'ruot_thit', 'tinh_trang_hon_nhan' => null, 'created_at' => now(), 'updated_at' => now()];
            if (isset($tv2['Trần Lê Khang'])) $quanHes[] = ['node_1_id' => $tv2['Nguyễn Thị Mai'], 'node_2_id' => $tv2['Trần Lê Khang'], 'loai_quan_he' => 'me_con', 'tinh_chat_quan_he' => 'ruot_thit', 'tinh_trang_hon_nhan' => null, 'created_at' => now(), 'updated_at' => now()];
        }

        // Đời 2: Vợ chồng ông Thọ - Hoa
        if (isset($tv2['Trần Lê Thọ']) && isset($tv2['Phạm Thị Hoa'])) {
            $quanHes[] = ['node_1_id' => $tv2['Trần Lê Thọ'], 'node_2_id' => $tv2['Phạm Thị Hoa'], 'loai_quan_he' => 'vo_chong', 'tinh_chat_quan_he' => null, 'tinh_trang_hon_nhan' => 'dang_ket_hon', 'created_at' => now(), 'updated_at' => now()];
        }

        // Đời 2 -> Đời 3: Con của ông Thọ
        if (isset($tv2['Trần Lê Thọ'])) {
            if (isset($tv2['Trần Lê Kỷ'])) $quanHes[] = ['node_1_id' => $tv2['Trần Lê Thọ'], 'node_2_id' => $tv2['Trần Lê Kỷ'], 'loai_quan_he' => 'cha_con', 'tinh_chat_quan_he' => 'ruot_thit', 'tinh_trang_hon_nhan' => null, 'created_at' => now(), 'updated_at' => now()];
            if (isset($tv2['Trần Lê Cường'])) $quanHes[] = ['node_1_id' => $tv2['Trần Lê Thọ'], 'node_2_id' => $tv2['Trần Lê Cường'], 'loai_quan_he' => 'cha_con', 'tinh_chat_quan_he' => 'ruot_thit', 'tinh_trang_hon_nhan' => null, 'created_at' => now(), 'updated_at' => now()];
            if (isset($tv2['Trần Thị Thu'])) $quanHes[] = ['node_1_id' => $tv2['Trần Lê Thọ'], 'node_2_id' => $tv2['Trần Thị Thu'], 'loai_quan_he' => 'cha_con', 'tinh_chat_quan_he' => 'ruot_thit', 'tinh_trang_hon_nhan' => null, 'created_at' => now(), 'updated_at' => now()];
        }
        if (isset($tv2['Phạm Thị Hoa'])) {
            if (isset($tv2['Trần Lê Kỷ'])) $quanHes[] = ['node_1_id' => $tv2['Phạm Thị Hoa'], 'node_2_id' => $tv2['Trần Lê Kỷ'], 'loai_quan_he' => 'me_con', 'tinh_chat_quan_he' => 'ruot_thit', 'tinh_trang_hon_nhan' => null, 'created_at' => now(), 'updated_at' => now()];
            if (isset($tv2['Trần Lê Cường'])) $quanHes[] = ['node_1_id' => $tv2['Phạm Thị Hoa'], 'node_2_id' => $tv2['Trần Lê Cường'], 'loai_quan_he' => 'me_con', 'tinh_chat_quan_he' => 'ruot_thit', 'tinh_trang_hon_nhan' => null, 'created_at' => now(), 'updated_at' => now()];
            if (isset($tv2['Trần Thị Thu'])) $quanHes[] = ['node_1_id' => $tv2['Phạm Thị Hoa'], 'node_2_id' => $tv2['Trần Thị Thu'], 'loai_quan_he' => 'me_con', 'tinh_chat_quan_he' => 'ruot_thit', 'tinh_trang_hon_nhan' => null, 'created_at' => now(), 'updated_at' => now()];
        }

        // Đời 3: Vợ chồng ông Kỷ - Cúc
        if (isset($tv2['Trần Lê Kỷ']) && isset($tv2['Lê Thị Cúc'])) {
            $quanHes[] = ['node_1_id' => $tv2['Trần Lê Kỷ'], 'node_2_id' => $tv2['Lê Thị Cúc'], 'loai_quan_he' => 'vo_chong', 'tinh_chat_quan_he' => null, 'tinh_trang_hon_nhan' => 'dang_ket_hon', 'created_at' => now(), 'updated_at' => now()];
        }

        // Đời 3 -> Đời 4: Con của ông Kỷ
        if (isset($tv2['Trần Lê Kỷ'])) {
            if (isset($tv2['Trần Lê Gia Bảo'])) $quanHes[] = ['node_1_id' => $tv2['Trần Lê Kỷ'], 'node_2_id' => $tv2['Trần Lê Gia Bảo'], 'loai_quan_he' => 'cha_con', 'tinh_chat_quan_he' => 'ruot_thit', 'tinh_trang_hon_nhan' => null, 'created_at' => now(), 'updated_at' => now()];
            if (isset($tv2['Trần Lê Minh Anh'])) $quanHes[] = ['node_1_id' => $tv2['Trần Lê Kỷ'], 'node_2_id' => $tv2['Trần Lê Minh Anh'], 'loai_quan_he' => 'cha_con', 'tinh_chat_quan_he' => 'ruot_thit', 'tinh_trang_hon_nhan' => null, 'created_at' => now(), 'updated_at' => now()];
        }
        if (isset($tv2['Lê Thị Cúc'])) {
            if (isset($tv2['Trần Lê Gia Bảo'])) $quanHes[] = ['node_1_id' => $tv2['Lê Thị Cúc'], 'node_2_id' => $tv2['Trần Lê Gia Bảo'], 'loai_quan_he' => 'me_con', 'tinh_chat_quan_he' => 'ruot_thit', 'tinh_trang_hon_nhan' => null, 'created_at' => now(), 'updated_at' => now()];
            if (isset($tv2['Trần Lê Minh Anh'])) $quanHes[] = ['node_1_id' => $tv2['Lê Thị Cúc'], 'node_2_id' => $tv2['Trần Lê Minh Anh'], 'loai_quan_he' => 'me_con', 'tinh_chat_quan_he' => 'ruot_thit', 'tinh_trang_hon_nhan' => null, 'created_at' => now(), 'updated_at' => now()];
        }

        // Đời 3 -> Đời 4: Con của chú Cường
        if (isset($tv2['Trần Lê Cường']) && isset($tv2['Trần Lê Tuấn'])) {
            $quanHes[] = ['node_1_id' => $tv2['Trần Lê Cường'], 'node_2_id' => $tv2['Trần Lê Tuấn'], 'loai_quan_he' => 'cha_con', 'tinh_chat_quan_he' => 'ruot_thit', 'tinh_trang_hon_nhan' => null, 'created_at' => now(), 'updated_at' => now()];
        }

        // Đời 4: Vợ chồng Gia Bảo - Ngọc
        if (isset($tv2['Trần Lê Gia Bảo']) && isset($tv2['Hoàng Thị Ngọc'])) {
            $quanHes[] = ['node_1_id' => $tv2['Trần Lê Gia Bảo'], 'node_2_id' => $tv2['Hoàng Thị Ngọc'], 'loai_quan_he' => 'vo_chong', 'tinh_chat_quan_he' => null, 'tinh_trang_hon_nhan' => 'dang_ket_hon', 'created_at' => now(), 'updated_at' => now()];
        }

        // Đời 4 -> Đời 5: Con của Gia Bảo
        if (isset($tv2['Trần Lê Gia Bảo'])) {
            if (isset($tv2['Trần Lê Minh Khôi'])) $quanHes[] = ['node_1_id' => $tv2['Trần Lê Gia Bảo'], 'node_2_id' => $tv2['Trần Lê Minh Khôi'], 'loai_quan_he' => 'cha_con', 'tinh_chat_quan_he' => 'ruot_thit', 'tinh_trang_hon_nhan' => null, 'created_at' => now(), 'updated_at' => now()];
            if (isset($tv2['Trần Lê Bảo Ngọc'])) $quanHes[] = ['node_1_id' => $tv2['Trần Lê Gia Bảo'], 'node_2_id' => $tv2['Trần Lê Bảo Ngọc'], 'loai_quan_he' => 'cha_con', 'tinh_chat_quan_he' => 'ruot_thit', 'tinh_trang_hon_nhan' => null, 'created_at' => now(), 'updated_at' => now()];
        }
        if (isset($tv2['Hoàng Thị Ngọc'])) {
            if (isset($tv2['Trần Lê Minh Khôi'])) $quanHes[] = ['node_1_id' => $tv2['Hoàng Thị Ngọc'], 'node_2_id' => $tv2['Trần Lê Minh Khôi'], 'loai_quan_he' => 'me_con', 'tinh_chat_quan_he' => 'ruot_thit', 'tinh_trang_hon_nhan' => null, 'created_at' => now(), 'updated_at' => now()];
            if (isset($tv2['Trần Lê Bảo Ngọc'])) $quanHes[] = ['node_1_id' => $tv2['Hoàng Thị Ngọc'], 'node_2_id' => $tv2['Trần Lê Bảo Ngọc'], 'loai_quan_he' => 'me_con', 'tinh_chat_quan_he' => 'ruot_thit', 'tinh_trang_hon_nhan' => null, 'created_at' => now(), 'updated_at' => now()];
        }


        // ---------------------------------------------------------
        // DÒNG HỌ 1: NGUYỄN BÁ & DÒNG HỌ 3: PHẠM VŨ
        // ---------------------------------------------------------
        $tv1 = DB::table('thanh_viens')->where('dong_ho_id', 1)->pluck('id', 'ho_ten');
        $tv3 = DB::table('thanh_viens')->where('dong_ho_id', 3)->pluck('id', 'ho_ten');

        // Nguyễn Bá
        if (isset($tv1['Nguyễn Bá Đạo']) && isset($tv1['Trần Thị Nhàn'])) {
            $quanHes[] = ['node_1_id' => $tv1['Nguyễn Bá Đạo'], 'node_2_id' => $tv1['Trần Thị Nhàn'], 'loai_quan_he' => 'vo_chong', 'tinh_chat_quan_he' => null, 'tinh_trang_hon_nhan' => 'dang_ket_hon', 'created_at' => now(), 'updated_at' => now()];
        }
        if (isset($tv1['Nguyễn Bá Đạo']) && isset($tv1['Nguyễn Bá Bình'])) {
            $quanHes[] = ['node_1_id' => $tv1['Nguyễn Bá Đạo'], 'node_2_id' => $tv1['Nguyễn Bá Bình'], 'loai_quan_he' => 'cha_con', 'tinh_chat_quan_he' => 'ruot_thit', 'tinh_trang_hon_nhan' => null, 'created_at' => now(), 'updated_at' => now()];
        }
        if (isset($tv1['Trần Thị Nhàn']) && isset($tv1['Nguyễn Bá Bình'])) {
            $quanHes[] = ['node_1_id' => $tv1['Trần Thị Nhàn'], 'node_2_id' => $tv1['Nguyễn Bá Bình'], 'loai_quan_he' => 'me_con', 'tinh_chat_quan_he' => 'ruot_thit', 'tinh_trang_hon_nhan' => null, 'created_at' => now(), 'updated_at' => now()];
        }
        if (isset($tv1['Nguyễn Bá Bình']) && isset($tv1['Nguyễn Bá Cường'])) {
            $quanHes[] = ['node_1_id' => $tv1['Nguyễn Bá Bình'], 'node_2_id' => $tv1['Nguyễn Bá Cường'], 'loai_quan_he' => 'cha_con', 'tinh_chat_quan_he' => 'ruot_thit', 'tinh_trang_hon_nhan' => null, 'created_at' => now(), 'updated_at' => now()];
        }
        if (isset($tv1['Nguyễn Bá Bình']) && isset($tv1['Nguyễn Thị Lan'])) {
            $quanHes[] = ['node_1_id' => $tv1['Nguyễn Bá Bình'], 'node_2_id' => $tv1['Nguyễn Thị Lan'], 'loai_quan_he' => 'cha_con', 'tinh_chat_quan_he' => 'ruot_thit', 'tinh_trang_hon_nhan' => null, 'created_at' => now(), 'updated_at' => now()];
        }

        // Phạm Vũ
        if (isset($tv3['Phạm Vũ Khang']) && isset($tv3['Phạm Vũ Thảo Chi'])) {
            $quanHes[] = ['node_1_id' => $tv3['Phạm Vũ Khang'], 'node_2_id' => $tv3['Phạm Vũ Thảo Chi'], 'loai_quan_he' => 'cha_con', 'tinh_chat_quan_he' => 'ruot_thit', 'tinh_trang_hon_nhan' => null, 'created_at' => now(), 'updated_at' => now()];
        }

        DB::table('quan_hes')->insert($quanHes);
    }
}