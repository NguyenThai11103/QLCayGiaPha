<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ho_ten'   => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:nguoi_dungs,email',
            'password' => 'required|string|min:6',
        ];
    }
}
