<?php

namespace App\Exports;

use App\Support\ThanhVienExcelColumns;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class ThanhVienExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithTitle, WithEvents, WithColumnFormatting
{
    private array $maCha = [];
    private array $maMe = [];
    private array $maVoChong = [];

    public function __construct(private readonly int $dongHoId)
    {
    }

    public function collection(): Collection
    {
        $members = DB::table('thanh_viens')
            ->where('dong_ho_id', $this->dongHoId)
            ->orderByRaw('COALESCE(doi_thu, 999999)')
            ->orderByRaw('COALESCE(thu_tu_sinh, 999999)')
            ->orderBy('ho_ten')
            ->get();

        $this->buildRelationMaps($members);

        return $members;
    }

    public function headings(): array
    {
        return ThanhVienExcelColumns::HEADINGS;
    }

    public function map($member): array
    {
        return [
            $member->ma_thanh_vien,
            $member->ho_ten,
            $member->ten_thuong_goi,
            $member->gioi_tinh,
            $member->doi_thu,
            $member->thu_tu_sinh,
            $this->isDead($member->tinh_trang_song) ? 'da_mat' : 'con_song',
            $this->formatDate($member->ngay_sinh_duong),
            $this->formatDate($member->ngay_sinh_am),
            $member->nam_sinh_uoc_tinh,
            $this->formatDate($member->ngay_mat_am),
            $member->nghe_nghiep,
            $member->dia_chi,
            $member->cho_o_hien_tai,
            $member->tieu_su,
            $this->maCha[$member->id] ?? '',
            $this->maMe[$member->id] ?? '',
            implode(', ', $this->maVoChong[$member->id] ?? []),
        ];
    }

    public function title(): string
    {
        return 'Thanh vien';
    }

    public function columnFormats(): array
    {
        return [
            'A' => NumberFormat::FORMAT_TEXT,
            'H' => NumberFormat::FORMAT_TEXT,
            'I' => NumberFormat::FORMAT_TEXT,
            'K' => NumberFormat::FORMAT_TEXT,
            'P' => NumberFormat::FORMAT_TEXT,
            'Q' => NumberFormat::FORMAT_TEXT,
            'R' => NumberFormat::FORMAT_TEXT,
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $highestRow = max(1, $sheet->getHighestRow());
                $highestColumn = 'R';

                $sheet->freezePane('A2');
                $sheet->getStyle("A1:{$highestColumn}1")->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => 'FF8B6A20']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);

                $sheet->getStyle("A1:{$highestColumn}{$highestRow}")->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['argb' => 'FFE8D8B5'],
                        ],
                    ],
                    'alignment' => ['vertical' => Alignment::VERTICAL_TOP],
                ]);

                $sheet->getStyle("O2:O{$highestRow}")->getAlignment()->setWrapText(true);

                $genderValidation = $sheet->getCell('D2')->getDataValidation();
                $genderValidation->setType(DataValidation::TYPE_LIST);
                $genderValidation->setErrorStyle(DataValidation::STYLE_STOP);
                $genderValidation->setAllowBlank(true);
                $genderValidation->setShowDropDown(true);
                $genderValidation->setFormula1('"nam,nu"');

                $statusValidation = $sheet->getCell('G2')->getDataValidation();
                $statusValidation->setType(DataValidation::TYPE_LIST);
                $statusValidation->setErrorStyle(DataValidation::STYLE_STOP);
                $statusValidation->setAllowBlank(true);
                $statusValidation->setShowDropDown(true);
                $statusValidation->setFormula1('"con_song,da_mat"');

                for ($row = 3; $row <= max($highestRow, 200); $row++) {
                    $sheet->getCell("D{$row}")->setDataValidation(clone $genderValidation);
                    $sheet->getCell("G{$row}")->setDataValidation(clone $statusValidation);
                }
            },
        ];
    }

    private function buildRelationMaps(Collection $members): void
    {
        if ($members->isEmpty()) {
            return;
        }

        $ids = $members->pluck('id')->all();
        $codesById = $members->pluck('ma_thanh_vien', 'id')->all();

        $relations = DB::table('quan_hes')
            ->where(function ($query) use ($ids) {
                $query->whereIn('node_1_id', $ids)
                    ->orWhereIn('node_2_id', $ids);
            })
            ->get();

        foreach ($relations as $relation) {
            if ($relation->loai_quan_he === 'cha_con' && isset($codesById[$relation->node_1_id])) {
                $this->maCha[$relation->node_2_id] = $codesById[$relation->node_1_id];
                continue;
            }

            if ($relation->loai_quan_he === 'me_con' && isset($codesById[$relation->node_1_id])) {
                $this->maMe[$relation->node_2_id] = $codesById[$relation->node_1_id];
                continue;
            }

            if ($relation->loai_quan_he === 'vo_chong') {
                if (isset($codesById[$relation->node_2_id])) {
                    $this->maVoChong[$relation->node_1_id][] = $codesById[$relation->node_2_id];
                }

                if (isset($codesById[$relation->node_1_id])) {
                    $this->maVoChong[$relation->node_2_id][] = $codesById[$relation->node_1_id];
                }
            }
        }
    }

    private function formatDate($value): ?string
    {
        if (!$value) {
            return null;
        }

        return substr((string) $value, 0, 10);
    }

    private function isDead($value): bool
    {
        return in_array($value, [0, '0', 'mat'], true);
    }
}
