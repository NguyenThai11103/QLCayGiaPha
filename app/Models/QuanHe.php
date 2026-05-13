<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuanHe extends Model
{
    use HasFactory;

    protected $table = 'quan_hes';

    protected $fillable = [
        'id_nguoi',
        'id_nguoi_lien_quan',
        'loai',
    ];

    public function nguoi()
    {
        return $this->belongsTo(Nguoi::class, 'id_nguoi');
    }

    public function nguoiLienQuan()
    {
        return $this->belongsTo(Nguoi::class, 'id_nguoi_lien_quan');
    }
}
