<?php

namespace App\Http\Requests\DongHo;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDongHoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id'                => 'required|integer|exists:dong_hos,id',
            'ten_dong_ho'       => 'sometimes|string|max:255',
            'mo_ta'             => 'nullable|string',
            'gia_huan'          => 'nullable|string',
            'loi_gioi_thieu'    => 'nullable|string',
            'dia_chi_tu_duong'  => 'nullable|string|max:255',
            'logo_path'         => 'nullable|string|max:255',
            'anh_tu_duong_path' => 'nullable|string|max:255',
            'theme_color'       => 'nullable|string|in:gold,crimson,jade,indigo,bronze',
        ];
    }
}
