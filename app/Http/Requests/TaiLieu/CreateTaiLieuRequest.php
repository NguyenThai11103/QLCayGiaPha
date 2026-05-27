<?php

namespace App\Http\Requests\TaiLieu;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class CreateTaiLieuRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'dong_ho_id'        => 'nullable|integer|exists:dong_hos,id',
            'thanh_vien_id'     => 'nullable|integer|exists:thanh_viens,id',
            'ten_tai_lieu'      => 'nullable|string|max:255',
            'mo_ta'             => 'nullable|string|max:2000',
            'file'              => 'nullable|file|max:51200|mimes:jpg,jpeg,png,gif,webp,pdf,doc,docx,xls,xlsx,ppt,pptx,mp4,mov,webm,txt',
            'duong_dan_file'    => 'nullable|string|max:255',
            'loai_file'         => 'nullable|string|max:50',
            'du_lieu_orc'       => 'nullable|string',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if (!$this->hasFile('file') && !$this->filled('duong_dan_file')) {
                $validator->errors()->add('file', 'Vui long chon tep tai len hoac cung cap duong dan file.');
            }
        });
    }
}
