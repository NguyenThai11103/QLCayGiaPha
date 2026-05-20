<?php

namespace App\Http\Requests\TaiLieu;

use Illuminate\Foundation\Http\FormRequest;

class CreateTaiLieuRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'dong_ho_id'        => 'nullable|integer|exists:dong_hos,id',
            'thanh_vien_id'     => 'nullable|integer|exists:thanh_viens,id',
            'duong_dan_file'    => 'required|string|max:255',
            'loai_file'         => 'required|string|max:50',
            'du_lieu_orc'       => 'nullable|string',
        ];
    }
}
