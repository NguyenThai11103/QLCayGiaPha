<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Laravel\Sanctum\HasApiTokens;

class NguoiDung extends Authenticatable
{
    use HasApiTokens, HasFactory;

    protected $table = 'nguoi_dungs';

    protected $fillable = [
        'dong_ho_id',
        'ho_ten',
        'email',
        'password',
        'google_id',
        'avatar',
        'thanh_vien_id',
        'quyen_han',
    ];

    protected $hidden = [
        'password',
    ];

    protected $appends = [
        'ho_va_ten',
        'ten_goi_nho',
        'anh_dai_dien',
        'is_master',
        'ten_chuc_vu',
    ];

    // ─── Accessors ─────────────────────────────────────────────────────────────

    public function getHoVaTenAttribute()
    {
        return $this->ho_ten;
    }

    public function getTenGoiNhoAttribute()
    {
        return $this->thanhVien?->ten_thuong_goi ?? $this->ho_ten;
    }

    public function getAnhDaiDienAttribute()
    {
        return $this->thanhVien?->anh_dai_dien;
    }

    public function getIsMasterAttribute()
    {
        return in_array($this->quyen_han, ['quan_ly']) ? 1 : 0;
    }

    public function getTenChucVuAttribute()
    {
        return in_array($this->quyen_han, ['quan_ly']) ? 'Quản trị dòng họ' : 'Thành viên';
    }

    // ─── Relationships ─────────────────────────────────────────────────────────

    public function dongHo()
    {
        return $this->belongsTo(DongHo::class, 'dong_ho_id');
    }

    public function thanhVien()
    {
        return $this->belongsTo(ThanhVien::class, 'thanh_vien_id');
    }

    /** Các dòng họ do tài khoản này tạo */
    public function dongHosDaTao()
    {
        return $this->hasMany(DongHo::class, 'nguoi_tao');
    }
}
