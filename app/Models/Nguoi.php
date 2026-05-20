<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Nguoi extends Model
{
    use HasFactory;

    public $timestamps = false;

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
        'ngay_sinh_am',
        'nam_sinh_uoc_tinh',
        'ngay_mat_am',
        'anh_dai_dien',
        'nghe_nghiep',
        'dia_chi',
        'cho_o_hien_tai',
        'tieu_su',
    ];

    protected $casts = [
        'ngay_sinh_duong' => 'date',
        'ngay_sinh_am' => 'date',
        'ngay_mat_am' => 'date',
        'tinh_trang_song' => 'integer',
    ];

    public function dongHo()
    {
        return $this->belongsTo(DongHo::class, 'dong_ho_id');
    }

    public function quanHeNode1()
    {
        return $this->hasMany(QuanHe::class, 'node_1_id');
    }

    public function quanHeNode2()
    {
        return $this->hasMany(QuanHe::class, 'node_2_id');
    }

    public function taiLieus()
    {
        return $this->hasMany(TepTin::class, 'thanh_vien_id');
    }
}
