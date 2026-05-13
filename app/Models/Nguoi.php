<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Nguoi extends Model
{
    use HasFactory;

    protected $table = 'nguois';

    protected $fillable = [
        'id_dong_ho',
        'ten_day_du',
        'gioi_tinh',
        'ngay_sinh',
        'ngay_mat',
        'da_mat',
        'id_cha',
        'id_me',
        'tieu_su',
        'anh_dai_dien',
    ];

    protected $casts = [
        'ngay_sinh' => 'date',
        'ngay_mat' => 'date',
        'da_mat' => 'boolean',
    ];

    public function dongHo()
    {
        return $this->belongsTo(DongHo::class, 'id_dong_ho');
    }

    public function cha()
    {
        return $this->belongsTo(Nguoi::class, 'id_cha');
    }

    public function me()
    {
        return $this->belongsTo(Nguoi::class, 'id_me');
    }

    public function conTheoCha()
    {
        return $this->hasMany(Nguoi::class, 'id_cha');
    }

    public function conTheoMe()
    {
        return $this->hasMany(Nguoi::class, 'id_me');
    }

    public function anhChiEm()
    {
        if (!$this->id_cha && !$this->id_me) {
            return Nguoi::whereRaw('1 = 0');
        }

        return Nguoi::where('id', '!=', $this->id)
            ->where(function ($query) {
                $query->where(function ($q) {
                    $q->whereNotNull('id_cha')->where('id_cha', $this->id_cha);
                })->orWhere(function ($q) {
                    $q->whereNotNull('id_me')->where('id_me', $this->id_me);
                });
            });
    }

    public function thamGiaSuKiens()
    {
        return $this->belongsToMany(SuKien::class, 'tham_gia_su_kiens', 'id_nguoi', 'id_su_kien')
            ->withPivot('vai_tro')
            ->withTimestamps();
    }

    public function tepTins()
    {
        return $this->hasMany(TepTin::class, 'id_nguoi');
    }

    public function laNam(): bool
    {
        return $this->gioi_tinh === 'nam';
    }

    public function laNu(): bool
    {
        return $this->gioi_tinh === 'nu';
    }

    public function lonHon(Nguoi $nguoi): bool
    {
        if (!$this->ngay_sinh || !$nguoi->ngay_sinh) {
            return false;
        }
        return $this->ngay_sinh->lt($nguoi->ngay_sinh);
    }
}
