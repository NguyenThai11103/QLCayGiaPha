<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FamilyInvitation extends Model
{
    use HasFactory;

    protected $table = 'loi_moi_tham_gias';

    protected $fillable = [
        'dong_ho_id',
        'thanh_vien_id',
        'invited_by',
        'email',
        'token_hash',
        'expires_at',
        'accepted_at',
        'accepted_by',
        'revoked_at',
        'last_sent_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'accepted_at' => 'datetime',
        'revoked_at' => 'datetime',
        'last_sent_at' => 'datetime',
    ];

    public function dongHo()
    {
        return $this->belongsTo(DongHo::class, 'dong_ho_id');
    }

    public function thanhVien()
    {
        return $this->belongsTo(ThanhVien::class, 'thanh_vien_id');
    }

    public function inviter()
    {
        return $this->belongsTo(NguoiDung::class, 'invited_by');
    }

    public function acceptedBy()
    {
        return $this->belongsTo(NguoiDung::class, 'accepted_by');
    }

    public function isAccepted(): bool
    {
        return $this->accepted_at !== null;
    }

    public function isRevoked(): bool
    {
        return $this->revoked_at !== null;
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function isUsable(): bool
    {
        return !$this->isAccepted() && !$this->isRevoked() && !$this->isExpired();
    }
}
