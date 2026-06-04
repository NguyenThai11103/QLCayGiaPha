<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NhatKyGiaPha extends Model
{
    use HasFactory;

    protected $table = 'nhat_ky_gia_phas';

    public $timestamps = false;

    protected $fillable = [
        'dong_ho_id',
        'thanh_vien_id',
        'nguoi_thuc_hien_id',
        'hanh_dong',
        'du_lieu_cu',
        'du_lieu_moi',
        'mo_ta',
        'created_at',
    ];

    protected $casts = [
        'du_lieu_cu' => 'json',
        'du_lieu_moi' => 'json',
    ];

    public function dongHo()
    {
        return $this->belongsTo(DongHo::class, 'dong_ho_id');
    }

    public function thanhVien()
    {
        return $this->belongsTo(ThanhVien::class, 'thanh_vien_id');
    }

    public function nguoiThucHien()
    {
        return $this->belongsTo(NguoiDung::class, 'nguoi_thuc_hien_id');
    }
}
