<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BoNhoQuanHe extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'cache_xung_ho';

    protected $fillable = [
        'dong_ho_id',
        'nguoi_goi_id',
        'nguoi_nghe_id',
        'danh_xung_a',
        'danh_xung_b',
        'khoang_cach_doi',
        'pattern_duong_di',
    ];

    public function nguoiGoi()
    {
        return $this->belongsTo(Nguoi::class, 'nguoi_goi_id');
    }

    public function nguoiNghe()
    {
        return $this->belongsTo(Nguoi::class, 'nguoi_nghe_id');
    }
}
