<?php

namespace App\Http\Requests\QuanHe;

use Illuminate\Foundation\Http\FormRequest;

class DeleteQuanHeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id' => 'required|integer|exists:quan_hes,id',
        ];
    }
}
