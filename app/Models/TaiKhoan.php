<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class TaiKhoan extends Authenticatable
{
    use HasApiTokens, HasFactory;

    protected $table = 'tai_khoans';

    protected $fillable = [
        'ten',
        'email',
        'mat_khau',
        'vai_tro',
    ];

    protected $hidden = [
        'mat_khau',
    ];

    public function getAuthPassword()
    {
        return $this->mat_khau;
    }

    public function dongHos()
    {
        return $this->belongsToMany(DongHo::class, 'dong_ho_tai_khoans', 'id_tai_khoan', 'id_dong_ho')
            ->withPivot('vai_tro')
            ->withTimestamps();
    }

    public function suKiensDaTao()
    {
        return $this->hasMany(SuKien::class, 'id_nguoi_tao');
    }
}
