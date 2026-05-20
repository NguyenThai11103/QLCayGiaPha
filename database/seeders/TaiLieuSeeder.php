<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TaiLieuSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('tai_lieus')->insert([
            [
                'thanh_vien_id' => 1,
                'dong_ho_id' => 1,
                'duong_dan_file' => 'uploads/images/avatar_ong_noi.jpg',
                'loai_file' => 'hinh_anh',
                'du_lieu_orc' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'thanh_vien_id' => null,
                'dong_ho_id' => 1,
                'duong_dan_file' => 'uploads/documents/gia_pha_nguyen_ba_1990.pdf',
                'loai_file' => 'pdf',
                'du_lieu_orc' => 'Bản scan cuốn gia phả cũ được viết từ năm 1990.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'thanh_vien_id' => null,
                'dong_ho_id' => 1,
                'duong_dan_file' => 'uploads/images/nha_tho_to_nguyen_ba.png',
                'loai_file' => 'hinh_anh',
                'du_lieu_orc' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'thanh_vien_id' => 3,
                'dong_ho_id' => 1,
                'duong_dan_file' => 'uploads/videos/le_mung_tho_cu_nam_2023.mp4',
                'loai_file' => 'video',
                'du_lieu_orc' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'thanh_vien_id' => null,
                'dong_ho_id' => 1,
                'duong_dan_file' => 'uploads/documents/to_uoc_dong_ho_ban_viet_tay.jpg',
                'loai_file' => 'hinh_anh',
                'du_lieu_orc' => 'Tộc ước dòng họ Nguyễn Bá. Điều 1: Con cháu phải hiếu thảo với ông bà cha mẹ...',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'thanh_vien_id' => 4, // Nguyễn Bá Cường
                'dong_ho_id' => 1,
                'duong_dan_file' => 'uploads/images/avatar_anh_cuong.jpg',
                'loai_file' => 'hinh_anh',
                'du_lieu_orc' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'thanh_vien_id' => 5, // Nguyễn Thị Lan
                'dong_ho_id' => 1,
                'duong_dan_file' => 'uploads/documents/bang_khen_hoc_tap_lan.jpg',
                'loai_file' => 'hinh_anh',
                'du_lieu_orc' => 'Bằng khen sinh viên xuất sắc năm học 2025-2026.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'thanh_vien_id' => null,
                'dong_ho_id' => 1,
                'duong_dan_file' => 'uploads/documents/bien_ban_hop_ho_dau_nam.docx',
                'loai_file' => 'document',
                'du_lieu_orc' => 'Nội dung cuộc họp bàn về việc đóng góp quỹ khuyến học năm 2026.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'thanh_vien_id' => null,
                'dong_ho_id' => 1,
                'duong_dan_file' => 'uploads/images/ban_do_mo_phan_dong_ho.jpg',
                'loai_file' => 'hinh_anh',
                'du_lieu_orc' => 'Sơ đồ vị trí các phần mộ tại nghĩa trang dòng họ.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
