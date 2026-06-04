<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ResetPasswordRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'email'           => ['required', 'email', 'exists:nguoi_dungs,email'],
            'token'           => ['required', 'string'],
            'password'        => ['required', 'string', 'min:6'],
            'confirmPassword' => ['required', 'string', 'same:password'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'email.required'           => 'Vui lòng nhập địa chỉ email.',
            'email.email'              => 'Địa chỉ email không đúng định dạng.',
            'email.exists'             => 'Email này không tồn tại trong hệ thống.',
            'token.required'           => 'Mã token khôi phục là bắt buộc.',
            'password.required'        => 'Vui lòng nhập mật khẩu mới.',
            'password.min'             => 'Mật khẩu mới phải từ 6 ký tự trở lên.',
            'confirmPassword.required' => 'Vui lòng nhập lại mật khẩu mới.',
            'confirmPassword.same'     => 'Mật khẩu xác nhận chưa khớp với mật khẩu mới.',
        ];
    }
}
