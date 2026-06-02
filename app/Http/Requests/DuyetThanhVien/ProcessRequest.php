<?php

namespace App\Http\Requests\DuyetThanhVien;

use Illuminate\Foundation\Http\FormRequest;

class ProcessRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() && in_array($this->user()->quyen_han, ['truong_toc', 'quan_ly'], true);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'user_id'                 => ['required', 'integer', 'exists:nguoi_dungs,id'],
            'action'                  => ['required', 'string', 'in:approve,reject'],
            'thanh_vien_lien_quan_id' => ['nullable', 'integer', 'exists:thanh_viens,id'],
            'loai_quan_he'            => ['nullable', 'string', 'in:vo_chong,cha_con,me_con,anh_chi_em'],
            'doi_thu'                 => ['nullable', 'integer', 'min:1'],
            'thu_tu_sinh'             => ['nullable', 'integer', 'min:1'],
        ];
    }
}
