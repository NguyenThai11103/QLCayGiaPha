<?php

namespace App\Http\Requests\SuKien;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSuKienRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id'                => 'required|integer|exists:su_kiens,id',
            'dong_ho_id'        => 'nullable|integer|exists:dong_hos,id',
            'ten_su_kien'       => 'nullable|string|max:255',
            'loai_su_kien'      => 'nullable|string|max:255',
            'ngay_duong'        => 'nullable|date',
            'ngay_am'           => 'nullable|date',
            'lap_lai_hang_nam'  => 'nullable|boolean',
            'dia_diem'          => 'nullable|string|max:255',
            'mo_ta'             => 'nullable|string',
        ];
    }
}
