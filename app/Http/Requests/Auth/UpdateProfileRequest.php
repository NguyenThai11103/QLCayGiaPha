<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
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
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'ho_ten'       => 'required|string|max:255',
            'tieu_su'      => 'nullable|string',
            'anh_dai_dien' => 'nullable|string',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'ho_ten.required' => 'Họ và tên là bắt buộc.',
            'ho_ten.string'   => 'Họ và tên phải là chuỗi ký tự.',
            'ho_ten.max'      => 'Họ và tên không được vượt quá 255 ký tự.',
            'tieu_su.string'  => 'Tiểu sử phải là chuỗi ký tự.',
            'anh_dai_dien.string' => 'Ảnh đại diện phải là chuỗi ký tự (URL).',
        ];
    }
}
