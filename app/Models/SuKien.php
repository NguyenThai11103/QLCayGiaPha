<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SuKien extends Model
{
    use HasFactory;

    protected $table = 'su_kiens';

    protected $fillable = [
        'dong_ho_id',
        'thanh_vien_id',
        'ten_su_kien',
        'loai_su_kien',
        'ngay_duong',
        'ngay_am',
        'lap_lai_hang_nam',
        'dia_diem',
        'mo_ta',
    ];

    protected $casts = [
        'ngay_duong'       => 'date',
        'ngay_am'          => 'date',
        'lap_lai_hang_nam' => 'boolean',
    ];

    // ─── Relationships ─────────────────────────────────────────────────────────

    public function dongHo()
    {
        return $this->belongsTo(DongHo::class, 'dong_ho_id');
    }

    public function thanhVien()
    {
        return $this->belongsTo(ThanhVien::class, 'thanh_vien_id');
    }

    public function participants()
    {
        return $this->belongsToMany(NguoiDung::class, 'su_kien_nguoi_dung', 'su_kien_id', 'nguoi_dung_id')
                    ->withPivot('so_nguoi_di_cung', 'ghi_chu')
                    ->withTimestamps();
    }
}
