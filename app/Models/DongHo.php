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
        'logo_path',
        'mo_ta',
        'gia_huan',
        'loi_gioi_thieu',
        'dia_chi_tu_duong',
        'anh_tu_duong_path',
        'thuy_to_id',
        'nguoi_tao',
        'theme_color',
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

    public function nguoiDungs()
    {
        return $this->hasMany(NguoiDung::class, 'dong_ho_id');
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

    public function moPhans()
    {
        return $this->hasMany(MoPhan::class, 'dong_ho_id');
    }

    public function cacheXungHos()
    {
        return $this->hasMany(CacheXungHo::class, 'dong_ho_id');
    }
}
