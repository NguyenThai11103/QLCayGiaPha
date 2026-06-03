<?php

namespace App\Exports\Sheets;

use App\Support\ThanhVienExcelColumns;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class ThanhVienTemplateDataSheet implements WithHeadings, ShouldAutoSize, WithTitle, WithEvents, WithColumnFormatting
{
    public function headings(): array
    {
        return ThanhVienExcelColumns::HEADINGS;
    }

    public function title(): string
    {
        return 'Nhap lieu';
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
                $sheet->freezePane('A2');
                $sheet->getStyle('A1:R1')->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => 'FF8B6A20']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);

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

                for ($row = 2; $row <= 300; $row++) {
                    $sheet->getCell("D{$row}")->setDataValidation(clone $genderValidation);
                    $sheet->getCell("G{$row}")->setDataValidation(clone $statusValidation);
                }
            },
        ];
    }
}
