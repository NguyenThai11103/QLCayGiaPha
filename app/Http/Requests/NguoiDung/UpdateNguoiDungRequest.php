<?php

namespace App\Http\Requests\NguoiDung;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateNguoiDungRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id'            => 'required|integer|exists:nguoi_dungs,id',
            'ho_ten'        => 'nullable|string|max:255',
            'email'         => [
                'nullable',
                'string',
                'email',
                'max:255',
                Rule::unique('nguoi_dungs')->ignore($this->input('id')),
            ],
            'password'      => 'nullable|string|min:6',
            'dong_ho_id'    => 'nullable|integer|exists:dong_hos,id',
            'thanh_vien_id' => 'nullable|integer|exists:thanh_viens,id',
            'quyen_han'     => 'nullable|string|in:admin,truong_toc,quan_ly,thanh_vien',
        ];
    }
}
