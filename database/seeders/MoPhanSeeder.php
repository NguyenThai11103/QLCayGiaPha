<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

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
            $khuMos = $this->seedKhuMo((int) $dongHoId, $toaDoGoc, $nguoiCapNhatId);

            foreach ($thanhViens->take(12)->values() as $index => $thanhVien) {
                $viDo = round($toaDoGoc['vi_do'] + ($index * 0.0003500), 7);
                $kinhDo = round($toaDoGoc['kinh_do'] + ($index * 0.0004200), 7);
                $ghiChu = $ghiChuMau[$index % count($ghiChuMau)];
                $anhMoPath = $this->createSamplePhoto((int) $dongHoId, (int) $thanhVien->id, $thanhVien->ho_ten);
                $khuMoId = $khuMos[$index % count($khuMos)] ?? null;

                DB::table('mo_phans')->updateOrInsert(
                    ['thanh_vien_id' => $thanhVien->id],
                    [
                        'dong_ho_id' => $thanhVien->dong_ho_id,
                        'khu_mo_id' => $khuMoId,
                        'vi_do' => $viDo,
                        'kinh_do' => $kinhDo,
                        'ghi_chu' => $ghiChu,
                        'anh_mo_path' => $anhMoPath,
                        'anh_mo_disk' => 'public',
                        'nguoi_cap_nhat_id' => $nguoiCapNhatId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );

                $moPhan = DB::table('mo_phans')
                    ->where('thanh_vien_id', $thanhVien->id)
                    ->first();

                if (!$moPhan) {
                    continue;
                }

                $historyExists = DB::table('mo_phan_lich_sus')
                    ->where('mo_phan_id', $moPhan->id)
                    ->exists();

                if (!$historyExists) {
                    DB::table('mo_phan_lich_sus')->insert([
                        'mo_phan_id' => $moPhan->id,
                        'nguoi_cap_nhat_id' => $nguoiCapNhatId,
                        'vi_do_cu' => null,
                        'kinh_do_cu' => null,
                        'vi_do_moi' => $viDo,
                        'kinh_do_moi' => $kinhDo,
                        'ghi_chu_cu' => null,
                        'ghi_chu_moi' => $ghiChu,
                        'anh_mo_cu' => null,
                        'anh_mo_moi' => $anhMoPath,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    private function createSamplePhoto(int $dongHoId, int $thanhVienId, string $hoTen): string
    {
        $path = "mo-phan/{$dongHoId}/seed-{$thanhVienId}.svg";

        if (Storage::disk('public')->exists($path)) {
            return $path;
        }

        $initial = mb_strtoupper(mb_substr(trim($hoTen), 0, 1));
        $safeName = htmlspecialchars($hoTen, ENT_QUOTES, 'UTF-8');

        $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f7f0df"/>
      <stop offset="100%" stop-color="#d7be86"/>
    </linearGradient>
    <linearGradient id="stone" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#b8902c"/>
      <stop offset="100%" stop-color="#5c3a1e"/>
    </linearGradient>
  </defs>
  <rect width="900" height="600" fill="url(#bg)"/>
  <circle cx="130" cy="110" r="72" fill="#fff8e8" opacity="0.7"/>
  <rect x="250" y="132" width="400" height="360" rx="34" fill="url(#stone)"/>
  <rect x="304" y="194" width="292" height="190" rx="18" fill="#fff8e8" opacity="0.9"/>
  <text x="450" y="282" text-anchor="middle" font-family="serif" font-size="92" font-weight="700" fill="#8b5a2b">{$initial}</text>
  <text x="450" y="344" text-anchor="middle" font-family="serif" font-size="34" font-weight="700" fill="#5c3a1e">{$safeName}</text>
  <rect x="190" y="470" width="520" height="42" rx="21" fill="#8b5a2b" opacity="0.22"/>
</svg>
SVG;

        Storage::disk('public')->put($path, $svg);

        return $path;
    }

    private function seedKhuMo(int $dongHoId, array $toaDoGoc, ?int $nguoiCapNhatId): array
    {
        $items = [
            [
                'ten_khu_mo' => 'Khu mộ tổ',
                'dia_chi' => 'Khu nghĩa trang chính của dòng họ',
                'mo_ta' => 'Nơi an nghỉ của các bậc tiền nhân đời đầu.',
                'vi_do' => round($toaDoGoc['vi_do'] - 0.0007, 7),
                'kinh_do' => round($toaDoGoc['kinh_do'] - 0.0005, 7),
            ],
            [
                'ten_khu_mo' => 'Khu mộ nhánh trưởng',
                'dia_chi' => 'Khu đất cao phía sau nhà bia',
                'mo_ta' => 'Tập trung mộ phần của nhánh trưởng và con cháu trực hệ.',
                'vi_do' => round($toaDoGoc['vi_do'] + 0.0012, 7),
                'kinh_do' => round($toaDoGoc['kinh_do'] + 0.0010, 7),
            ],
        ];

        $ids = [];
        foreach ($items as $index => $item) {
            $photoPath = $this->createKhuMoPhoto($dongHoId, $index + 1, $item['ten_khu_mo']);
            DB::table('khu_mos')->updateOrInsert(
                ['dong_ho_id' => $dongHoId, 'ten_khu_mo' => $item['ten_khu_mo']],
                [
                    ...$item,
                    'anh_khu_mo_path' => $photoPath,
                    'anh_khu_mo_disk' => 'public',
                    'nguoi_cap_nhat_id' => $nguoiCapNhatId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            $ids[] = DB::table('khu_mos')
                ->where('dong_ho_id', $dongHoId)
                ->where('ten_khu_mo', $item['ten_khu_mo'])
                ->value('id');
        }

        return array_filter($ids);
    }

    private function createKhuMoPhoto(int $dongHoId, int $index, string $name): string
    {
        $path = "khu-mo/{$dongHoId}/seed-khu-{$index}.svg";
        if (Storage::disk('public')->exists($path)) {
            return $path;
        }

        $safeName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
        $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="520" viewBox="0 0 900 520">
  <rect width="900" height="520" fill="#f7f0df"/>
  <rect x="70" y="330" width="760" height="78" rx="39" fill="#d7be86"/>
  <g fill="#8b5a2b">
    <rect x="180" y="170" width="90" height="180" rx="16"/>
    <rect x="315" y="130" width="110" height="220" rx="18"/>
    <rect x="475" y="155" width="94" height="195" rx="16"/>
    <rect x="615" y="190" width="86" height="160" rx="14"/>
  </g>
  <text x="450" y="455" text-anchor="middle" font-family="serif" font-size="42" font-weight="700" fill="#5c3a1e">{$safeName}</text>
</svg>
SVG;

        Storage::disk('public')->put($path, $svg);

        return $path;
    }
}
