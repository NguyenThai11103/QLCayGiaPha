<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class BangLuongExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithEvents, WithColumnFormatting
{
    protected $data;
    protected $stt = 0;

    public function __construct($data)
    {
        $this->data = collect($data);
    }

    public function collection()
    {
        return $this->data;
    }

    public function headings(): array
    {
        return [
            'STT',
            'Họ và tên',
            'Chức vụ',
            'Lương cơ bản',
            'Số buổi',
            'Số ngày làm',
            'Thành tiền',
            'Tổng điểm KPI',
            'Tiền KPI',
            'Tiền thầy',
            'Thưởng',
            'Phạt',
            'Tổng lương',
        ];
    }

    public function map($row): array
    {
        $this->stt++;
        return [
            $this->stt,
            $row['ho_va_ten'],
            $row['ten_chuc_vu'],
            $row['luong_co_ban'],
            $row['tong_buoi'],
            $row['so_ngay_lam'],
            $row['tong_luong_thang'],
            $row['kpi'],
            $row['tien_kpi'],
            $row['tien_thay'],
            $row['thuong'],
            $row['phat'],
            $row['tong_luong'],
        ];
    }

    public function columnFormats(): array
    {
        return [
            'D' => '#,##0',
            'G' => '#,##0',
            'I' => '#,##0',
            'J' => '#,##0',
            'K' => '#,##0',
            'L' => '#,##0',
            'M' => '#,##0',
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $highestRow = $sheet->getHighestRow();
                $highestColumn = 'M'; // Tương ứng cột 'Tổng lương'
                $cellRange = 'A1:' . $highestColumn . $highestRow;

                // 1. Áp dụng viền (border) cho toàn bộ bảng
                $sheet->getStyle($cellRange)->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['argb' => 'FF000000'],
                        ],
                    ],
                    'alignment' => [
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                // 2. Style cho dòng tiêu đề (Nền Vàng, In đậm, Căn giữa)
                $sheet->getStyle('A1:' . $highestColumn . '1')->applyFromArray([
                    'font' => [
                        'bold' => true,
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'color' => ['argb' => 'FFFFFF00'], // Nền Vàng
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                // Căn giữa cho cột STT
                $sheet->getStyle('A2:A' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                // 3. Tô màu các ô dựa trên giá trị và tô đậm cột "Họ và tên", "Tổng lương"
                for ($row = 2; $row <= $highestRow; $row++) {
                    // In đậm "Họ và tên" giống ảnh
                    $sheet->getStyle('B' . $row)->getFont()->setBold(true);

                    // In đậm "Tổng lương"
                    $sheet->getStyle('M' . $row)->getFont()->setBold(true);

                    // Tô màu nền có điều kiện cho cột Tổng lương
                    $cellValue = $sheet->getCell('M' . $row)->getCalculatedValue();

                    if (is_numeric($cellValue)) {
                        $color = null;
                        if ($cellValue > 0) {
                            $color = 'FF22C55E'; // Xanh lá cây nhạt (giống đuôi lục)
                        } elseif ($cellValue < 0) {
                            $color = 'FFEF4444'; // Đỏ
                        } else {
                            $color = 'FFF97316'; // Cam (nếu bằng 0)
                        }

                        if ($color) {
                            $sheet->getStyle('M' . $row)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB($color);
                        }
                    }

                    // Tô đỏ chữ cho tiền phạt hoặc tiền nợ thầy
                    $tienThay = $sheet->getCell('J' . $row)->getCalculatedValue();
                    if (is_numeric($tienThay) && $tienThay < 0) {
                        $sheet->getStyle('J' . $row)->getFont()->getColor()->setARGB('FFFF0000');
                    }

                    $tienPhat = $sheet->getCell('L' . $row)->getCalculatedValue();
                    if (is_numeric($tienPhat) && $tienPhat > 0) {
                        $sheet->getStyle('L' . $row)->getFont()->getColor()->setARGB('FFFF0000');
                    }
                }

                // 4. Thêm dòng tổng cộng ở cuối bảng
                $summaryRow = $highestRow + 1;
                // Merge từ A đến L cho tiêu đề
                $sheet->mergeCells('A' . $summaryRow . ':L' . $summaryRow);
                $sheet->setCellValue('A' . $summaryRow, 'TỔNG LƯƠNG TẤT CẢ:');
                $sheet->getStyle('A' . $summaryRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

                // In đậm dòng tổng
                $sheet->getStyle('A' . $summaryRow . ':M' . $summaryRow)->getFont()->setBold(true);

                // Chỉ tính Tổng Tiền (cột M)
                $sheet->setCellValue('M' . $summaryRow, "=SUM(M2:M{$highestRow})");

                // Viền cho dòng tổng
                $sheet->getStyle('A' . $summaryRow . ':M' . $summaryRow)->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['argb' => 'FF000000'],
                        ],
                    ],
                ]);

                // Nổi bật cột M Tổng cộng
                $sheet->getStyle('M' . $summaryRow)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFFFFF00'); // Nền vàng
                $sheet->getStyle('M' . $summaryRow)->getFont()->getColor()->setARGB('FFFF0000'); // Chữ đỏ
            },
        ];
    }
}
