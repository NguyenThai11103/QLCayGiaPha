<?php

namespace App\Http\Requests\TaiLieu;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTaiLieuRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id'                => 'required|integer|exists:tai_lieus,id',
            'dong_ho_id'        => 'nullable|integer|exists:dong_hos,id',
            'thanh_vien_id'     => 'nullable|integer|exists:thanh_viens,id',
            'duong_dan_file'    => 'nullable|string|max:255',
            'loai_file'         => 'nullable|string|max:50',
            'du_lieu_orc'       => 'nullable|string',
        ];
    }
}
