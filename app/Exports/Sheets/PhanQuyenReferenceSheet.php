<?php

namespace App\Exports\Sheets;

use App\Models\PhanQuyen;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;

class PhanQuyenReferenceSheet implements FromCollection, WithHeadings, ShouldAutoSize, WithTitle
{
    public function collection()
    {
        return PhanQuyen::select('id', 'ten_quyen')->get();
    }

    public function headings(): array
    {
        return [
            'ID (Điền vào cột id_quyen)',
            'Tên Quyền',
        ];
    }

    public function title(): string
    {
        return 'Danh sách Chức vụ';
    }
}
