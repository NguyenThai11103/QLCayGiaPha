<?php

namespace App\Http\Requests\CacheXungHo;

use Illuminate\Foundation\Http\FormRequest;

class CreateCacheXungHoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'dong_ho_id'       => 'required|integer|exists:dong_hos,id',
            'nguoi_goi_id'     => 'required|integer|exists:thanh_viens,id',
            'nguoi_nghe_id'    => 'required|integer|exists:thanh_viens,id',
            'danh_xung_a'      => 'nullable|string|max:255',
            'danh_xung_b'      => 'nullable|string|max:255',
            'khoang_cach_doi'  => 'nullable|integer',
            'pattern_duong_di' => 'nullable|string|max:255',
        ];
    }
}
