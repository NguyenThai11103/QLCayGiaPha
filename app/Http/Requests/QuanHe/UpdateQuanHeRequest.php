<?php

namespace App\Http\Requests\QuanHe;

use Illuminate\Foundation\Http\FormRequest;

class UpdateQuanHeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id'                  => 'required|integer|exists:quan_hes,id',
            'node_1_id'           => 'nullable|integer|exists:thanh_viens,id',
            'node_2_id'           => 'nullable|integer|exists:thanh_viens,id',
            'loai_quan_he'        => 'nullable|string|max:50',
            'tinh_chat_quan_he'   => 'nullable|string|max:50',
            'tinh_trang_hon_nhan' => 'nullable|string|max:50',
        ];
    }
}
