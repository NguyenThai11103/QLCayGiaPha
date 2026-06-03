<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NhanVatTieuBieu extends Model
{
    use HasFactory;

    protected $table = 'nhan_vat_tieu_bieus';

    protected $fillable = [
        'dong_ho_id',
        'thanh_vien_id',
        'tieu_de',
        'tom_tat',
        'cau_chuyen',
        'dong_gop',
        'linh_vuc',
        'giai_doan',
        'nam_bat_dau',
        'nam_ket_thuc',
        'anh_bia_path',
        'anh_bia_disk',
        'noi_bat',
        'trang_thai',
        'thu_tu_hien_thi',
        'nguoi_cap_nhat_id',
    ];

    protected $casts = [
        'noi_bat' => 'boolean',
        'nam_bat_dau' => 'integer',
        'nam_ket_thuc' => 'integer',
        'thu_tu_hien_thi' => 'integer',
    ];
}
