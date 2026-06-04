<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaiLieu extends Model
{
    use HasFactory;

    protected $table = 'tai_lieus';

    protected $fillable = [
        'dong_ho_id',
        'thanh_vien_id',
        'ten_tai_lieu',
        'mo_ta',
        'duong_dan_file',
        'ten_file_goc',
        'loai_file',
        'mime_type',
        'kich_thuoc',
        'disk',
        'path',
        'nguoi_tai_len_id',
        'du_lieu_orc',
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

    public function nguoiTaiLen()
    {
        return $this->belongsTo(NguoiDung::class, 'nguoi_tai_len_id');
    }
}
