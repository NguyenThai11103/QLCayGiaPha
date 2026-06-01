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
        'trang_thai_gia_nhap',
        'trang_thai',
    ];

    protected $hidden = [
        'password',
    ];

    protected $appends = [
        'ho_va_ten',
        'ten_goi_nho',
        'anh_dai_dien',
        'ten_chuc_vu',
        'ma_thanh_vien',
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
        return $this->thanhVien?->anh_dai_dien ?? $this->avatar;
    }



    public function getTenChucVuAttribute()
    {
        return in_array($this->quyen_han, ['quan_ly']) ? 'Quản trị dòng họ' : 'Thành viên';
    }

    public function getMaThanhVienAttribute()
    {
        return $this->thanhVien?->ma_thanh_vien;
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

    public function moPhansDaCapNhat()
    {
        return $this->hasMany(MoPhan::class, 'nguoi_cap_nhat_id');
    }
}
