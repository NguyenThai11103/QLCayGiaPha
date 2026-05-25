<?php

namespace App\Http\Requests\Onboarding;

use Illuminate\Foundation\Http\FormRequest;

class JoinClanRequest extends FormRequest
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
            'dong_ho_id' => 'required|integer|exists:dong_hos,id',
            'ho_ten_thanh_vien' => 'required|string|max:255',
            'gioi_tinh' => 'required|in:nam,nu,khong_ro',
        ];
    }

    public function messages(): array
    {
        return [
            'dong_ho_id.required' => 'Mã dòng họ là bắt buộc.',
            'dong_ho_id.exists' => 'Dòng họ không tồn tại hoặc đã bị khóa.',
            'ho_ten_thanh_vien.required' => 'Vui lòng nhập họ tên của bạn trong gia phả.',
            'gioi_tinh.required' => 'Vui lòng chọn giới tính.',
            'gioi_tinh.in' => 'Giới tính không hợp lệ.',
        ];
    }
}
