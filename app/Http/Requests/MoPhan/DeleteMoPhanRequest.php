<?php

namespace App\Http\Requests\MoPhan;

use Illuminate\Foundation\Http\FormRequest;

class DeleteMoPhanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id' => 'required|integer|exists:mo_phans,id',
        ];
    }
}
