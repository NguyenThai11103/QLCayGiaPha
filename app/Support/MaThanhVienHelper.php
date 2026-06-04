<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MaThanhVienHelper
{
    public static function generate($idDongHo)
    {
        $dongHo = DB::table('dong_hos')->where('id', $idDongHo)->first();
        if (!$dongHo) {
            $prefix = 'GP'; // Gia pha
        } else {
            $words = explode(' ', trim($dongHo->ten_dong_ho));
            $prefix = '';
            foreach ($words as $w) {
                if (!empty($w)) {
                    $prefix .= mb_strtoupper(mb_substr($w, 0, 1));
                }
            }
        }
        
        do {
            $randomStr = strtoupper(Str::random(5));
            $ma = $prefix . $randomStr;
            $exists = DB::table('thanh_viens')->where('ma_thanh_vien', $ma)->exists();
        } while ($exists);

        return $ma;
    }
}
