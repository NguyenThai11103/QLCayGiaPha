<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MoPhan extends Model
{
    use HasFactory;

    protected $table = 'mo_phans';

    protected $fillable = [
        'dong_ho_id',
        'thanh_vien_id',
        'vi_do',
        'kinh_do',
        'ghi_chu',
        'nguoi_cap_nhat_id',
    ];

    protected $casts = [
        'vi_do' => 'float',
        'kinh_do' => 'float',
    ];

    public function dongHo()
    {
        return $this->belongsTo(DongHo::class, 'dong_ho_id');
    }

    public function thanhVien()
    {
        return $this->belongsTo(ThanhVien::class, 'thanh_vien_id');
    }

    public function nguoiCapNhat()
    {
        return $this->belongsTo(NguoiDung::class, 'nguoi_cap_nhat_id');
    }
}
