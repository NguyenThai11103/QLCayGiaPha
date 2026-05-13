<?php

namespace App\Http\Requests\DongHo;

use Illuminate\Foundation\Http\FormRequest;

class DeleteDongHoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id' => 'required|integer|exists:dong_hos,id',
        ];
    }
}
