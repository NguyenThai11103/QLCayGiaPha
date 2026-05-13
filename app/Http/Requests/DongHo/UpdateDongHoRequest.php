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
            'id' => 'required|integer|exists:dong_hos,id',
            'ten_dong_ho' => 'sometimes|string|max:255',
            'mo_ta' => 'nullable|string',
        ];
    }
}
