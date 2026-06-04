<?php

namespace App\Http\Requests\Admin\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $adminId = $this->user()?->id;

        return [
            'ho_ten' => ['required', 'string', 'max:255'],
            'email'  => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('admins', 'email')->ignore($adminId),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'ho_ten.required' => 'Họ tên là bắt buộc.',
            'email.required'  => 'Email là bắt buộc.',
            'email.email'     => 'Email không đúng định dạng.',
            'email.unique'    => 'Email này đã được sử dụng.',
        ];
    }
}
