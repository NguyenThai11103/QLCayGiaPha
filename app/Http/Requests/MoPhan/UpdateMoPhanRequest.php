<?php

namespace App\Http\Requests\MoPhan;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateMoPhanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id' => 'required|integer|exists:mo_phans,id',
            'vi_do' => 'sometimes|required|numeric|between:-90,90',
            'kinh_do' => 'sometimes|required|numeric|between:-180,180',
            'ghi_chu' => 'nullable|string|max:2000',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $hasLocation = $this->has('vi_do') || $this->has('kinh_do');
            $hasNote = $this->has('ghi_chu');

            if (!$hasLocation && !$hasNote) {
                $validator->errors()->add('id', 'Can gui it nhat mot truong can cap nhat.');
            }
        });
    }
}
