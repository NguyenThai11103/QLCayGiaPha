<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use App\Exports\Sheets\NhanVienDataSheet;
use App\Exports\Sheets\PhanQuyenReferenceSheet;

class NhanVienTemplateExport implements WithMultipleSheets
{
    public function sheets(): array
    {
        return [
            new NhanVienDataSheet(),
            new PhanQuyenReferenceSheet(),
        ];
    }
}
