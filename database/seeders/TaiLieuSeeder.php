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
            // ----------------------------------------------------------------
            // DÒNG HỌ 2: TRẦN LÊ
            // ----------------------------------------------------------------
            [
                'thanh_vien_id' => null,
                'dong_ho_id' => 2,
                'duong_dan_file' => 'uploads/documents/gia_pha_tran_le_2000.pdf',
                'loai_file' => 'pdf',
                'du_lieu_orc' => 'Bản scan cuốn gia phả họ Trần Lê, lưu giữ tại từ đường.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'thanh_vien_id' => null,
                'dong_ho_id' => 2,
                'duong_dan_file' => 'uploads/images/tu_duong_tran_le.jpg',
                'loai_file' => 'hinh_anh',
                'du_lieu_orc' => 'Ảnh mặt trước nhà thờ tổ dòng họ Trần Lê.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'thanh_vien_id' => 10, // Trần Lê Phúc (Cụ Tổ)
                'dong_ho_id' => 2,
                'duong_dan_file' => 'uploads/documents/to_uoc_tran_le.docx',
                'loai_file' => 'document',
                'du_lieu_orc' => 'Tộc ước dòng họ Trần Lê do cụ Trần Lê Phúc để lại.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'thanh_vien_id' => 14, // Trần Lê Kỷ
                'dong_ho_id' => 2,
                'duong_dan_file' => 'uploads/videos/video_hop_ho_2025.mp4',
                'loai_file' => 'video',
                'du_lieu_orc' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // ----------------------------------------------------------------
            // DÒNG HỌ 3: PHẠM VŨ
            // ----------------------------------------------------------------
            [
                'thanh_vien_id' => null,
                'dong_ho_id' => 3,
                'duong_dan_file' => 'uploads/images/ho_pham_vu_to_uoc.jpg',
                'loai_file' => 'hinh_anh',
                'du_lieu_orc' => 'Bản khắc gỗ gia quy họ Phạm Vũ.',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }
}
