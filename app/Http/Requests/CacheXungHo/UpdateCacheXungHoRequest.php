<?php

namespace App\Http\Requests\CacheXungHo;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCacheXungHoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id'               => 'required|integer|exists:cache_xung_ho,id',
            'dong_ho_id'       => 'nullable|integer|exists:dong_hos,id',
            'nguoi_goi_id'     => 'nullable|integer|exists:thanh_viens,id',
            'nguoi_nghe_id'    => 'nullable|integer|exists:thanh_viens,id',
            'danh_xung_a'      => 'nullable|string|max:255',
            'danh_xung_b'      => 'nullable|string|max:255',
            'khoang_cach_doi'  => 'nullable|integer',
            'pattern_duong_di' => 'nullable|string|max:255',
        ];
    }
}
