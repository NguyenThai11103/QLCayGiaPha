<?php

namespace App\Http\Requests\Nguoi;

use Illuminate\Foundation\Http\FormRequest;

class DeleteNguoiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id' => 'required|integer|exists:thanh_viens,id',
        ];
    }
}
