<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class TaiKhoan extends Authenticatable
{
    use HasApiTokens, HasFactory;

    public $timestamps = false;

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

    public function getAuthPassword()
    {
        return $this->password;
    }

    public function dongHo()
    {
        return $this->belongsTo(DongHo::class, 'dong_ho_id');
    }

    public function thanhVien()
    {
        return $this->belongsTo(Nguoi::class, 'thanh_vien_id');
    }
}
