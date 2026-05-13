<?php

namespace App\Http\Requests\Nguoi;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Validator;

class CreateNguoiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_dong_ho' => 'required|integer|exists:dong_hos,id',
            'ten_day_du' => 'required|string|max:255',
            'gioi_tinh' => 'required|string|in:nam,nu',
            'ngay_sinh' => 'nullable|date',
            'da_mat' => 'required|boolean',
            'ngay_mat' => 'nullable|date',
            'id_cha' => 'nullable|integer|exists:nguois,id',
            'id_me' => 'nullable|integer|exists:nguois,id',
            'id_vo_chong' => 'nullable|integer|exists:nguois,id',
            'tieu_su' => 'nullable|string',
            'anh_dai_dien' => 'nullable|string',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $idCha = $this->input('id_cha');
            $idMe = $this->input('id_me');
            $idVoChong = $this->input('id_vo_chong');

            if ($idCha && $idMe && $this->laToTienCua($idCha, $idMe)) {
                $validator->errors()->add('id_me', 'Cha va me khong duoc la to tien hoac con chau cua nhau.');
            }

            if ($idCha && $idMe && $this->laToTienCua($idMe, $idCha)) {
                $validator->errors()->add('id_cha', 'Cha va me khong duoc la to tien hoac con chau cua nhau.');
            }

            if ($idVoChong) {
                $nguoiVoChong = DB::table('nguois')->where('id', $idVoChong)->first();

                if ($nguoiVoChong && (int) $nguoiVoChong->id_dong_ho !== (int) $this->input('id_dong_ho')) {
                    $validator->errors()->add('id_vo_chong', 'Vo chong phai thuoc cung dong ho de hien thi trong cay.');
                }

                if ($this->nguoiDaCoVoChong($idVoChong)) {
                    $validator->errors()->add('id_vo_chong', 'Thanh vien duoc chon da co vo hoac chong.');
                }
            }
        });
    }

    private function laToTienCua(int|string $idToTien, int|string $idNguoi): bool
    {
        $idToTien = (int) $idToTien;
        $hangDoi = [(int) $idNguoi];
        $daXem = [];

        while ($hangDoi) {
            $idHienTai = array_shift($hangDoi);

            if (isset($daXem[$idHienTai])) {
                continue;
            }

            $daXem[$idHienTai] = true;
            $nguoi = DB::table('nguois')->select('id_cha', 'id_me')->where('id', $idHienTai)->first();

            if (!$nguoi) {
                continue;
            }

            if ((int) $nguoi->id_cha === $idToTien || (int) $nguoi->id_me === $idToTien) {
                return true;
            }

            if ($nguoi->id_cha) {
                $hangDoi[] = (int) $nguoi->id_cha;
            }

            if ($nguoi->id_me) {
                $hangDoi[] = (int) $nguoi->id_me;
            }
        }

        return false;
    }

    private function nguoiDaCoVoChong(int|string $idNguoi): bool
    {
        return DB::table('quan_hes')
            ->where('loai', 'vo_chong')
            ->where(function ($query) use ($idNguoi) {
                $query->where('id_nguoi', $idNguoi)
                    ->orWhere('id_nguoi_lien_quan', $idNguoi);
            })
            ->exists();
    }
}
