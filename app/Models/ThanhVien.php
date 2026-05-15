<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ThanhVien extends Model
{
    use HasFactory;

    protected $table = 'thanh_viens';

    protected $fillable = [
        'dong_ho_id',
        'ho_ten',
        'ten_thuong_goi',
        'gioi_tinh',
        'thu_tu_sinh',
        'doi_thu',
        'tinh_trang_song',
        'ngay_sinh_duong',
        'ngay_mat_am',
        'anh_dai_dien',
        'nghe_nghiep',
        'dia_chi',
        'cho_o_hien_tai',
        'tieu_su',
    ];

    protected $casts = [
        'ngay_sinh_duong' => 'date',
        'ngay_mat_am'     => 'date',
        'thu_tu_sinh'     => 'integer',
        'doi_thu'         => 'integer',
    ];

    // ─── Relationships ─────────────────────────────────────────────────────────

    public function dongHo()
    {
        return $this->belongsTo(DongHo::class, 'dong_ho_id');
    }

    /** Tài khoản người dùng liên kết với thành viên này */
    public function taiKhoan()
    {
        return $this->hasOne(NguoiDung::class, 'thanh_vien_id');
    }

    /** Tài liệu / hình ảnh của thành viên */
    public function taiLieus()
    {
        return $this->hasMany(TaiLieu::class, 'thanh_vien_id');
    }

    /** Quan hệ mà thành viên này là node_1 */
    public function quanHesNguon()
    {
        return $this->hasMany(QuanHe::class, 'node_1_id');
    }

    /** Quan hệ mà thành viên này là node_2 */
    public function quanHesDich()
    {
        return $this->hasMany(QuanHe::class, 'node_2_id');
    }

    /** Cache xưng hô – là người gọi */
    public function cacheXungHoGoi()
    {
        return $this->hasMany(CacheXungHo::class, 'nguoi_goi_id');
    }

    /** Cache xưng hô – là người nghe */
    public function cacheXungHoNghe()
    {
        return $this->hasMany(CacheXungHo::class, 'nguoi_nghe_id');
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    public function laNam(): bool
    {
        return $this->gioi_tinh === 'nam';
    }

    public function laNu(): bool
    {
        return $this->gioi_tinh === 'nu';
    }

    public function daMat(): bool
    {
        return $this->tinh_trang_song === 'mat';
    }
}
