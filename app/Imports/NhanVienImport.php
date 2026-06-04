<?php

namespace App\Imports;

use App\Models\NhanVien;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Validators\Failure;

class NhanVienImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnFailure
{
    use SkipsFailures;

    public $successCount = 0;
    public $skippedCount = 0;

    public function model(array $row)
    {
        // Simple duplicate check
        $exists = NhanVien::where('email', $row['email'])
            ->orWhere('so_dien_thoai', $row['so_dien_thoai'])
            ->exists();

        if ($exists) {
            $this->skippedCount++;
            return null;
        }

        $this->successCount++;

        return new NhanVien([
            'ho_va_ten'     => $row['ho_va_ten'],
            'email'         => $row['email'],
            'so_dien_thoai' => $row['so_dien_thoai'],
            'ngay_sinh'     => $row['ngay_sinh'] ? \Carbon\Carbon::parse($row['ngay_sinh']) : null,
            'ngay_bat_dau_lam' => $row['ngay_bat_dau_lam'] ? \Carbon\Carbon::parse($row['ngay_bat_dau_lam']) : now(),
            
            // Defaults
            'password'      => Hash::make('123456'), // Default password
            'is_open'       => 1,
            'is_master'     => 0,
            'id_quyen'      => isset($row['id_quyen']) ? $row['id_quyen'] : 1,
            'ten_goi_nho'   => $row['ten_goi_nho'] ?? null,
        ]);
    }

    public function rules(): array
    {
        return [
            'ho_va_ten' => 'required',
            'email' => 'required|email',
            'so_dien_thoai' => 'required',
        ];
    }
}
