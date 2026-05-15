<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CacheXungHo extends Model
{
    use HasFactory;

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

    protected $casts = [
        'khoang_cach_doi' => 'integer',
    ];

    // ─── Relationships ─────────────────────────────────────────────────────────

    public function dongHo()
    {
        return $this->belongsTo(DongHo::class, 'dong_ho_id');
    }

    /** Người đang gọi */
    public function nguoiGoi()
    {
        return $this->belongsTo(ThanhVien::class, 'nguoi_goi_id');
    }

    /** Người được gọi */
    public function nguoiNghe()
    {
        return $this->belongsTo(ThanhVien::class, 'nguoi_nghe_id');
    }
}
