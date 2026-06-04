<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnhAlbum extends Model
{
    use HasFactory;

    protected $table = 'anh_albums';

    protected $fillable = [
        'album_id',
        'duong_dan_file',
        'path',
        'disk',
        'caption',
        'nguoi_tai_len_id',
    ];

    public function album()
    {
        return $this->belongsTo(AlbumAnh::class, 'album_id');
    }

    public function nguoiTaiLen()
    {
        return $this->belongsTo(NguoiDung::class, 'nguoi_tai_len_id');
    }
}
