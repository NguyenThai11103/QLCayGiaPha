<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class NhanVatTieuBieuSeeder extends Seeder
{
    public function run(): void
    {
        $families = DB::table('dong_hos')
            ->orderBy('id')
            ->get(['id', 'ten_dong_ho']);

        foreach ($families as $family) {
            $members = DB::table('thanh_viens')
                ->where('dong_ho_id', $family->id)
                ->orderByRaw('CASE WHEN doi_thu IS NULL THEN 999 ELSE doi_thu END')
                ->orderByRaw('CASE WHEN tieu_su IS NULL OR tieu_su = "" THEN 1 ELSE 0 END')
                ->orderBy('thu_tu_sinh')
                ->orderBy('id')
                ->limit(3)
                ->get();

            foreach ($members as $index => $member) {
                $profile = $this->profileFor((int) $family->id, $family->ten_dong_ho, $member, $index);

                DB::table('nhan_vat_tieu_bieus')->updateOrInsert(
                    [
                        'dong_ho_id' => $family->id,
                        'thanh_vien_id' => $member->id,
                    ],
                    [
                        ...$profile,
                        'updated_at' => now(),
                    ]
                );
            }
        }
    }

    private function profileFor(int $familyId, string $familyName, object $member, int $index): array
    {
        $roles = [
            [
                'linh_vuc' => 'Gìn giữ gia phong',
                'label' => 'Người đặt nền nếp gia phong',
                'summary' => 'Hồ sơ ghi lại vai trò gìn giữ nếp nhà, kết nối con cháu và truyền lại các giá trị cốt lõi của dòng họ.',
            ],
            [
                'linh_vuc' => 'Gia phả và tư liệu',
                'label' => 'Người lưu giữ ký ức dòng họ',
                'summary' => 'Nhân vật gắn với việc sưu tầm, kể lại và bảo quản những câu chuyện quan trọng của gia tộc.',
            ],
            [
                'linh_vuc' => 'Đóng góp cộng đồng',
                'label' => 'Tấm gương đóng góp cho cộng đồng',
                'summary' => 'Hồ sơ vinh danh tinh thần trách nhiệm, sự tận tụy và những đóng góp được con cháu nhắc nhớ.',
            ],
        ];

        $role = $roles[$index % count($roles)];
        $period = $this->periodFor($member);
        $coverPath = $this->createCover($familyId, (int) $member->id, $member->ho_ten, $role['linh_vuc'], $index);

        return [
            'tieu_de' => $role['label'],
            'tom_tat' => $role['summary'] . ' ' . ($member->tieu_su ?: ''),
            'cau_chuyen' => implode("\n\n", [
                "{$member->ho_ten} là một gương mặt được dòng họ {$familyName} chọn ghi nhận trong kho tư liệu tiêu biểu.",
                'Những câu chuyện về nhân vật này có thể tiếp tục được trưởng tộc và quản lý bổ sung từ lời kể gia đình, hình ảnh, văn bản hoặc tài liệu đã lưu trữ.',
            ]),
            'dong_gop' => implode("\n\n", [
                'Góp phần duy trì ký ức gia đình, nề nếp thờ cúng tổ tiên và sự kết nối giữa các thế hệ.',
                'Hồ sơ mẫu này là điểm khởi đầu để dòng họ hoàn thiện thêm thông tin chính xác, tài liệu chứng thực và các mốc sự kiện liên quan.',
            ]),
            'linh_vuc' => $role['linh_vuc'],
            'giai_doan' => $period,
            'nam_bat_dau' => $this->yearFromDate($member->ngay_sinh_duong ?? null),
            'nam_ket_thuc' => $this->yearFromDate($member->ngay_mat_am ?? null),
            'anh_bia_path' => $coverPath,
            'anh_bia_disk' => 'public',
            'noi_bat' => $index === 0,
            'trang_thai' => 'published',
            'thu_tu_hien_thi' => $index + 1,
            'nguoi_cap_nhat_id' => $this->managerId($familyId),
            'created_at' => now(),
        ];
    }

    private function createCover(int $familyId, int $memberId, string $name, string $field, int $index): string
    {
        $path = "nhan-vat-tieu-bieu/dong-ho-{$familyId}/seed-{$memberId}.svg";

        if (Storage::disk('public')->exists($path)) {
            return $path;
        }

        $palettes = [
            ['#f7f0df', '#b8902c', '#5c3a1e'],
            ['#eef4e6', '#4a7a52', '#2f5d3a'],
            ['#f3ece2', '#c44535', '#8b2a1f'],
        ];
        $palette = $palettes[$index % count($palettes)];
        $initial = mb_strtoupper(mb_substr(trim($name), 0, 1));
        $safeName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
        $safeField = htmlspecialchars($field, ENT_QUOTES, 'UTF-8');

        $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720">
  <rect width="1200" height="720" fill="{$palette[0]}"/>
  <circle cx="1040" cy="130" r="230" fill="{$palette[1]}" opacity="0.16"/>
  <circle cx="140" cy="640" r="260" fill="{$palette[2]}" opacity="0.12"/>
  <path d="M130 178 C286 84 454 96 586 180 C718 264 888 268 1068 170" fill="none" stroke="{$palette[1]}" stroke-width="22" stroke-linecap="round" opacity="0.28"/>
  <rect x="94" y="94" width="1012" height="532" rx="42" fill="#fffef9" opacity="0.72"/>
  <circle cx="240" cy="302" r="108" fill="{$palette[1]}" opacity="0.92"/>
  <text x="240" y="338" text-anchor="middle" font-family="serif" font-size="116" font-weight="700" fill="#fffef9">{$initial}</text>
  <text x="390" y="282" font-family="serif" font-size="58" font-weight="700" fill="{$palette[2]}">{$safeName}</text>
  <text x="392" y="342" font-family="sans-serif" font-size="28" font-weight="700" fill="{$palette[1]}">{$safeField}</text>
  <rect x="392" y="386" width="470" height="8" rx="4" fill="{$palette[1]}" opacity="0.38"/>
  <text x="392" y="454" font-family="sans-serif" font-size="24" font-weight="600" fill="{$palette[2]}" opacity="0.82">Hồ sơ nhân vật tiêu biểu</text>
</svg>
SVG;

        Storage::disk('public')->put($path, $svg);

        return $path;
    }

    private function periodFor(object $member): ?string
    {
        $start = $this->yearFromDate($member->ngay_sinh_duong ?? null);
        $end = $this->yearFromDate($member->ngay_mat_am ?? null);

        if ($start && $end) {
            return "{$start} - {$end}";
        }

        if ($start) {
            return "Từ {$start}";
        }

        return $member->doi_thu ? "Đời {$member->doi_thu}" : null;
    }

    private function yearFromDate(?string $date): ?int
    {
        if (!$date) {
            return null;
        }

        $year = (int) substr($date, 0, 4);

        return $year > 0 ? $year : null;
    }

    private function managerId(int $familyId): ?int
    {
        $id = DB::table('nguoi_dungs')
            ->where('dong_ho_id', $familyId)
            ->orderByRaw("CASE WHEN quyen_han = 'truong_toc' THEN 0 WHEN quyen_han = 'quan_ly' THEN 1 ELSE 2 END")
            ->orderBy('id')
            ->value('id');

        return $id ? (int) $id : null;
    }
}
