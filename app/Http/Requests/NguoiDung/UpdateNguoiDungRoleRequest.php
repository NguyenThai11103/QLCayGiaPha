<?php

namespace App\Http\Requests\NguoiDung;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNguoiDungRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id' => 'required|integer|exists:nguoi_dungs,id',
            'quyen_han' => 'required|string|in:quan_ly,thanh_vien',
        ];
    }

    public function messages(): array
    {
        return [
            'id.required' => 'Vui lòng chọn tài khoản thành viên.',
            'id.exists' => 'Tài khoản thành viên không tồn tại.',
            'quyen_han.required' => 'Vui lòng chọn vai trò cần cập nhật.',
            'quyen_han.in' => 'Vai trò chỉ được phép là quản lý hoặc thành viên.',
        ];
    }
}
