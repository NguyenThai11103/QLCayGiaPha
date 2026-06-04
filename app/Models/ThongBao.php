<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ThongBao extends Model
{
    use HasFactory;

    protected $table = 'thong_baos';

    protected $fillable = [
        'nguoi_dung_id',
        'loai',
        'tieu_de',
        'noi_dung',
        'da_doc',
    ];

    protected $casts = [
        'da_doc' => 'boolean',
    ];

    // ─── Scopes ────────────────────────────────────────────────────────────────
    
    public function scopeUnread($query)
    {
        return $query->where('da_doc', false);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('nguoi_dung_id', $userId);
    }

    // ─── Relationships ─────────────────────────────────────────────────────────

    public function nguoiDung()
    {
        return $this->belongsTo(NguoiDung::class, 'nguoi_dung_id');
    }
}
