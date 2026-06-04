<?php

namespace App\Exports\Sheets;

use App\Support\ThanhVienExcelColumns;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

class ThanhVienExcelGuideSheet implements FromArray, WithHeadings, ShouldAutoSize, WithTitle
{
    public function array(): array
    {
        return ThanhVienExcelColumns::guideRows();
    }

    public function headings(): array
    {
        return ['cot', 'bat_buoc', 'cach_nhap'];
    }

    public function title(): string
    {
        return 'Huong dan';
    }
}
