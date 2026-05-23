<?php

namespace App\Http\Requests\MoPhan;

use Illuminate\Foundation\Http\FormRequest;

class CreateMoPhanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'thanh_vien_id' => 'required|integer|exists:thanh_viens,id',
            'vi_do' => 'required|numeric|between:-90,90',
            'kinh_do' => 'required|numeric|between:-180,180',
            'ghi_chu' => 'nullable|string|max:2000',
        ];
    }
}
