<?php

namespace App\Http\Requests\SuKien;

use Illuminate\Foundation\Http\FormRequest;

class LeaveSuKienRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id' => 'required|integer|exists:su_kiens,id',
        ];
    }
}
