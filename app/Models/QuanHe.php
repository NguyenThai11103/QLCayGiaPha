<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuanHe extends Model
{
    use HasFactory;

    protected $table = 'quan_hes';

    protected $fillable = [
        'node_1_id',
        'node_2_id',
        'loai_quan_he',
        'tinh_chat_quan_he',
        'tinh_trang_hon_nhan',
    ];

    // ─── Relationships ─────────────────────────────────────────────────────────

    public function node1()
    {
        return $this->belongsTo(ThanhVien::class, 'node_1_id');
    }

    public function node2()
    {
        return $this->belongsTo(ThanhVien::class, 'node_2_id');
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    public function laVoChong(): bool
    {
        return $this->loai_quan_he === 'vo_chong';
    }

    public function laChaCon(): bool
    {
        return $this->loai_quan_he === 'cha_con';
    }

    public function laMeCon(): bool
    {
        return $this->loai_quan_he === 'me_con';
    }
}
