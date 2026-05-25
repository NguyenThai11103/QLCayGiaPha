<?php

namespace App\Http\Requests\Notification;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MarkReadNotificationRequest extends FormRequest
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
            'id' => [
                'required',
                'integer',
                Rule::exists('thong_baos', 'id')->where(function ($query) {
                    $query->where('nguoi_dung_id', $this->user()->id);
                }),
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'id.required' => 'Mã thông báo là bắt buộc.',
            'id.integer'  => 'Mã thông báo phải là số nguyên.',
            'id.exists'   => 'Thông báo không tồn tại hoặc không thuộc quyền sở hữu của bạn.',
        ];
    }
}
