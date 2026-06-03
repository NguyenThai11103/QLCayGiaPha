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
            'ho_ten'           => 'required|string|max:255',
            'email'            => 'required|string|email|max:255|unique:nguoi_dungs,email',
            'password'         => 'required|string|min:6',
            'dong_ho_id'       => 'nullable|exists:dong_hos,id',
            'new_clan_name'    => 'nullable|string|max:255',
            'new_clan_address' => 'nullable|string|max:255',
            'invitation_token' => 'nullable|string|max:128',
        ];
    }
}
