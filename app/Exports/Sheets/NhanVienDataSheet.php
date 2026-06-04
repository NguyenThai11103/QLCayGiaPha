<?php

namespace App\Exports\Sheets;

use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;

class NhanVienDataSheet implements WithHeadings, ShouldAutoSize, WithTitle
{
    public function headings(): array
    {
        return [
            'ho_va_ten',
            'email',
            'so_dien_thoai',
            'id_quyen',
            'ngay_bat_dau_lam',
            'ngay_sinh',
            'ten_goi_nho',
        ];
    }

    public function title(): string
    {
        return 'Nhập liệu';
    }
}
