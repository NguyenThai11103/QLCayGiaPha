<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AlbumAnh extends Model
{
    use HasFactory;

    protected $table = 'album_anhs';

    protected $fillable = [
        'dong_ho_id',
        'ten_album',
        'loai_album',
        'nam',
        'mo_ta',
        'nguoi_tao_id',
    ];

    public function dongHo()
    {
        return $this->belongsTo(DongHo::class, 'dong_ho_id');
    }

    public function nguoiTao()
    {
        return $this->belongsTo(NguoiDung::class, 'nguoi_tao_id');
    }

    public function photos()
    {
        return $this->hasMany(AnhAlbum::class, 'album_id');
    }
}
