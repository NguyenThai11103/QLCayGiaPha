<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SuKien extends Model
{
    use HasFactory;

    protected $table = 'su_kiens';

    protected $fillable = [
        'id_dong_ho',
        'tieu_de',
        'noi_dung',
        'ngay_dien_ra',
        'dia_diem',
        'id_nguoi_tao',
    ];

    protected $casts = [
        'ngay_dien_ra' => 'date',
    ];

    public function dongHo()
    {
        return $this->belongsTo(DongHo::class, 'id_dong_ho');
    }

    public function nguoiTao()
    {
        return $this->belongsTo(TaiKhoan::class, 'id_nguoi_tao');
    }

    public function nguoiThamGia()
    {
        return $this->belongsToMany(Nguoi::class, 'tham_gia_su_kiens', 'id_su_kien', 'id_nguoi')
            ->withPivot('vai_tro')
            ->withTimestamps();
    }
}
