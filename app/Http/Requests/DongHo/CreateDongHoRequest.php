<?php

namespace App\Http\Requests\DongHo;

use Illuminate\Foundation\Http\FormRequest;

class CreateDongHoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ten_dong_ho' => 'required|string|max:255',
            'mo_ta' => 'nullable|string',
        ];
    }
}
