<?php

namespace App\Http\Requests\TaiLieu;

use Illuminate\Foundation\Http\FormRequest;

class DeleteTaiLieuRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id' => 'required|integer|exists:tai_lieus,id',
        ];
    }
}
