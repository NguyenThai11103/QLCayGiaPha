<?php

namespace App\Http\Requests\NguoiDung;

use Illuminate\Foundation\Http\FormRequest;

class CreateNguoiDungRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ho_ten'        => 'required|string|max:255',
            'email'         => 'required|string|email|max:255|unique:nguoi_dungs,email',
            'password'      => 'required|string|min:6',
            'dong_ho_id'    => 'nullable|integer|exists:dong_hos,id',
            'thanh_vien_id' => 'nullable|integer|exists:thanh_viens,id',
            'quyen_han'     => 'nullable|string|in:admin,quan_ly,thanh_vien',
        ];
    }
}
