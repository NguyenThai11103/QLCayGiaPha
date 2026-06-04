<?php

namespace App\Exports;

use App\Exports\Sheets\ThanhVienExcelGuideSheet;
use App\Exports\Sheets\ThanhVienTemplateDataSheet;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class ThanhVienTemplateExport implements WithMultipleSheets
{
    public function sheets(): array
    {
        return [
            new ThanhVienTemplateDataSheet(),
            new ThanhVienExcelGuideSheet(),
        ];
    }
}
