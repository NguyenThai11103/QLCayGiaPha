<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DongHo extends Model
{
    use HasFactory;

    protected $table = 'dong_hos';

    protected $fillable = [
        'ten_dong_ho',
        'mo_ta',
    ];

    public function nguois()
    {
        return $this->hasMany(Nguoi::class, 'id_dong_ho');
    }

    public function taiKhoans()
    {
        return $this->belongsToMany(TaiKhoan::class, 'dong_ho_tai_khoans', 'id_dong_ho', 'id_tai_khoan')
            ->withPivot('vai_tro')
            ->withTimestamps();
    }

    public function suKiens()
    {
        return $this->hasMany(SuKien::class, 'id_dong_ho');
    }

    public function tepTins()
    {
        return $this->hasMany(TepTin::class, 'id_dong_ho');
    }
}
