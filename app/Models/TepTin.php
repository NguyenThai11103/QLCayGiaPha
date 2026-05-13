<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TepTin extends Model
{
    use HasFactory;

    protected $table = 'tep_tins';

    protected $fillable = [
        'id_nguoi',
        'id_dong_ho',
        'duong_dan',
        'loai',
        'mo_ta',
    ];

    public function nguoi()
    {
        return $this->belongsTo(Nguoi::class, 'id_nguoi');
    }

    public function dongHo()
    {
        return $this->belongsTo(DongHo::class, 'id_dong_ho');
    }
}
