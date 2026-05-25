<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MoPhanSeeder extends Seeder
{
    public function run(): void
    {
        $toaDoMauTheoDongHo = [
            1 => ['vi_do' => 21.1861200, 'kinh_do' => 106.0763100],
            2 => ['vi_do' => 20.4389100, 'kinh_do' => 106.1689500],
            3 => ['vi_do' => 16.4637100, 'kinh_do' => 107.5908600],
            4 => ['vi_do' => 17.4688500, 'kinh_do' => 106.6222600],
            5 => ['vi_do' => 19.8075200, 'kinh_do' => 105.7766400],
            6 => ['vi_do' => 20.4463500, 'kinh_do' => 106.3365800],
            7 => ['vi_do' => 18.6795800, 'kinh_do' => 105.6813300],
        ];

        $ghiChuMau = [
            'Mo nam o khu A, hang dau tien, gan cay da lon.',
            'Mo nam ben phai loi vao nghia trang, canh bia da mau xam.',
            'Mo o khu dat cao, phia sau nha bia chung cua dong ho.',
            'Mo gan cay dua to, cach cong nghia trang khoang 30 met.',
            'Mo nam canh lo gach cu, hang thu hai tinh tu duong chinh.',
        ];

        $thanhViensDaMatTheoDongHo = DB::table('thanh_viens')
            ->where('tinh_trang_song', 0)
            ->orderBy('dong_ho_id')
            ->orderBy('doi_thu')
            ->orderBy('id')
            ->get()
            ->groupBy('dong_ho_id');

        foreach ($thanhViensDaMatTheoDongHo as $dongHoId => $thanhViens) {
            $nguoiCapNhatId = DB::table('nguoi_dungs')
                ->where('dong_ho_id', $dongHoId)
                ->orderByRaw("CASE WHEN quyen_han = 'quan_ly' THEN 0 ELSE 1 END")
                ->orderBy('id')
                ->value('id');

            $toaDoGoc = $toaDoMauTheoDongHo[(int) $dongHoId] ?? [
                'vi_do' => 16.0470790 + ((int) $dongHoId * 0.01),
                'kinh_do' => 108.2062300 + ((int) $dongHoId * 0.01),
            ];

            foreach ($thanhViens->take(2)->values() as $index => $thanhVien) {
                DB::table('mo_phans')->updateOrInsert(
                    ['thanh_vien_id' => $thanhVien->id],
                    [
                        'dong_ho_id' => $thanhVien->dong_ho_id,
                        'vi_do' => round($toaDoGoc['vi_do'] + ($index * 0.0003500), 7),
                        'kinh_do' => round($toaDoGoc['kinh_do'] + ($index * 0.0004200), 7),
                        'ghi_chu' => $ghiChuMau[$index % count($ghiChuMau)],
                        'nguoi_cap_nhat_id' => $nguoiCapNhatId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }
        }
    }
}
