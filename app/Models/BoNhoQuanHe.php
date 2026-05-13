<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BoNhoQuanHe extends Model
{
    use HasFactory;

    protected $table = 'bo_nho_quan_hes';

    protected $fillable = [
        'id_tu_nguoi',
        'id_den_nguoi',
        'ten_quan_he',
        'duong_di',
    ];

    protected $casts = [
        'duong_di' => 'array',
    ];

    public function tuNguoi()
    {
        return $this->belongsTo(Nguoi::class, 'id_tu_nguoi');
    }

    public function denNguoi()
    {
        return $this->belongsTo(Nguoi::class, 'id_den_nguoi');
    }
}
