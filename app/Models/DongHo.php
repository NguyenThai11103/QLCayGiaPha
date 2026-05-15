<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DongHo extends Model
{
    use HasFactory;

    protected $table = 'dong_hos';

    protected $fillable = [
        'ten_dong_ho',
        'mo_ta',
        'dia_chi_tu_duong',
        'thuy_to_id',
        'nguoi_tao',
    ];

    // ─── Relationships ─────────────────────────────────────────────────────────

    public function thuyTo()
    {
        return $this->belongsTo(ThanhVien::class, 'thuy_to_id');
    }

    public function nguoiTao()
    {
        return $this->belongsTo(NguoiDung::class, 'nguoi_tao');
    }

    public function thanhViens()
    {
        return $this->hasMany(ThanhVien::class, 'dong_ho_id');
    }

    public function suKiens()
    {
        return $this->hasMany(SuKien::class, 'dong_ho_id');
    }

    public function taiLieus()
    {
        return $this->hasMany(TaiLieu::class, 'dong_ho_id');
    }

    public function cacheXungHos()
    {
        return $this->hasMany(CacheXungHo::class, 'dong_ho_id');
    }
}
