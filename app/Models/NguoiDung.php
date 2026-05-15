<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Laravel\Sanctum\HasApiTokens;

class NguoiDung extends Authenticatable
{
    use HasApiTokens, HasFactory;

    protected $table = 'nguoi_dungs';

    protected $fillable = [
        'dong_ho_id',
        'ho_ten',
        'email',
        'password',
        'thanh_vien_id',
        'quyen_han',
    ];

    protected $hidden = [
        'password',
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

    /** Các dòng họ do tài khoản này tạo */
    public function dongHosDaTao()
    {
        return $this->hasMany(DongHo::class, 'nguoi_tao');
    }
}
