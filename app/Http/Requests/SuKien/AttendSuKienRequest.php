<?php

namespace App\Http\Requests\SuKien;

use Illuminate\Foundation\Http\FormRequest;

class AttendSuKienRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id' => 'required|integer|exists:su_kiens,id',
            'so_nguoi_di_cung' => 'nullable|integer|min:0',
            'ghi_chu' => 'nullable|string|max:255',
        ];
    }
}
