<?php

namespace App\Http\Requests\NguoiDung;

use Illuminate\Foundation\Http\FormRequest;

class ProvisionMemberAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'thanh_vien_id' => 'required|integer|exists:thanh_viens,id',
            'email' => 'required|string|email|max:255|unique:nguoi_dungs,email',
        ];
    }

    public function messages(): array
    {
        return [
            'thanh_vien_id.required' => 'Vui lòng chọn thành viên cần cấp tài khoản.',
            'thanh_vien_id.exists' => 'Thành viên được chọn không tồn tại.',
            'email.required' => 'Vui lòng nhập email của thành viên.',
            'email.email' => 'Email không hợp lệ.',
            'email.unique' => 'Email này đã được dùng cho tài khoản khác.',
        ];
    }
}
