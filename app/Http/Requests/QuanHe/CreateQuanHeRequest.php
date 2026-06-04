<?php

namespace App\Http\Requests\QuanHe;

use Illuminate\Foundation\Http\FormRequest;

class CreateQuanHeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'node_1_id'           => 'required|integer|exists:thanh_viens,id',
            'node_2_id'           => 'required|integer|exists:thanh_viens,id',
            'loai_quan_he'        => 'required|string|max:50',
            'tinh_chat_quan_he'   => 'nullable|string|max:50',
            'tinh_trang_hon_nhan' => 'nullable|string|max:50',
        ];
    }
}
