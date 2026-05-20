<?php

namespace App\Http\Requests\CacheXungHo;

use Illuminate\Foundation\Http\FormRequest;

class DeleteCacheXungHoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id' => 'required|integer|exists:cache_xung_ho,id',
        ];
    }
}
