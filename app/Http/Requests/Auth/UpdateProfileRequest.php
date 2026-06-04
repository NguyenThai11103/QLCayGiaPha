<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ho_ten' => 'required|string|max:255',
            'tieu_su' => 'nullable|string',
            'anh_dai_dien' => 'nullable|string|max:2048',
            'anh_dai_dien_file' => 'nullable|image|max:2048',
        ];
    }

    public function messages(): array
    {
        return [
            'ho_ten.required' => 'Họ và tên là bắt buộc.',
            'ho_ten.string' => 'Họ và tên phải là chuỗi ký tự.',
            'ho_ten.max' => 'Họ và tên không được vượt quá 255 ký tự.',
            'tieu_su.string' => 'Tiểu sử phải là chuỗi ký tự.',
            'anh_dai_dien.string' => 'Ảnh đại diện phải là chuỗi ký tự (URL).',
            'anh_dai_dien.max' => 'URL ảnh đại diện không được vượt quá 2048 ký tự.',
            'anh_dai_dien_file.image' => 'Tệp ảnh đại diện phải là hình ảnh.',
            'anh_dai_dien_file.max' => 'Tệp ảnh đại diện không được vượt quá 2MB.',
        ];
    }
}
