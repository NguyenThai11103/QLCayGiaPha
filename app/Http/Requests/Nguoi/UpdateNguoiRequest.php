<?php

namespace App\Http\Requests\Nguoi;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Validator;

class UpdateNguoiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id' => 'required|integer|exists:nguois,id',
            'id_dong_ho' => 'sometimes|integer|exists:dong_hos,id',
            'ten_day_du' => 'sometimes|string|max:255',
            'gioi_tinh' => 'sometimes|string|in:nam,nu',
            'ngay_sinh' => 'nullable|date',
            'da_mat' => 'sometimes|boolean',
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
            $nguoi = DB::table('nguois')->where('id', $this->input('id'))->first();

            if (!$nguoi) {
                return;
            }

            $idNguoi = (int) $this->input('id');
            $idDongHo = $this->has('id_dong_ho') ? (int) $this->input('id_dong_ho') : (int) $nguoi->id_dong_ho;
            $idCha = $this->has('id_cha') ? $this->input('id_cha') : $nguoi->id_cha;
            $idMe = $this->has('id_me') ? $this->input('id_me') : $nguoi->id_me;
            $idVoChong = $this->has('id_vo_chong') ? $this->input('id_vo_chong') : $this->layVoChongHienTai($idNguoi);

            if ($idCha && (int) $idCha === $idNguoi) {
                $validator->errors()->add('id_cha', 'Khong the chon chinh thanh vien nay lam cha.');
            }

            if ($idMe && (int) $idMe === $idNguoi) {
                $validator->errors()->add('id_me', 'Khong the chon chinh thanh vien nay lam me.');
            }

            if ($idVoChong && (int) $idVoChong === $idNguoi) {
                $validator->errors()->add('id_vo_chong', 'Khong the chon chinh thanh vien nay lam vo hoac chong.');
            }

            if ($idCha && $this->laToTienCua($idNguoi, $idCha)) {
                $validator->errors()->add('id_cha', 'Khong the chon con chau lam cha.');
            }

            if ($idMe && $this->laToTienCua($idNguoi, $idMe)) {
                $validator->errors()->add('id_me', 'Khong the chon con chau lam me.');
            }

            if ($idCha && $idMe && $this->laToTienCua($idCha, $idMe)) {
                $validator->errors()->add('id_me', 'Cha va me khong duoc la to tien hoac con chau cua nhau.');
            }

            if ($idCha && $idMe && $this->laToTienCua($idMe, $idCha)) {
                $validator->errors()->add('id_cha', 'Cha va me khong duoc la to tien hoac con chau cua nhau.');
            }

            if ($idVoChong) {
                $nguoiVoChong = DB::table('nguois')->where('id', $idVoChong)->first();

                if ($nguoiVoChong && (int) $nguoiVoChong->id_dong_ho !== $idDongHo) {
                    $validator->errors()->add('id_vo_chong', 'Vo chong phai thuoc cung dong ho de hien thi trong cay.');
                }

                if ($this->nguoiDaCoVoChongKhac($idVoChong, $idNguoi)) {
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

    private function layVoChongHienTai(int $idNguoi): ?int
    {
        $quanHe = DB::table('quan_hes')
            ->where('loai', 'vo_chong')
            ->where(function ($query) use ($idNguoi) {
                $query->where('id_nguoi', $idNguoi)
                    ->orWhere('id_nguoi_lien_quan', $idNguoi);
            })
            ->first();

        if (!$quanHe) {
            return null;
        }

        return (int) ($quanHe->id_nguoi === $idNguoi ? $quanHe->id_nguoi_lien_quan : $quanHe->id_nguoi);
    }

    private function nguoiDaCoVoChongKhac(int|string $idNguoi, int $idHienTai): bool
    {
        return DB::table('quan_hes')
            ->where('loai', 'vo_chong')
            ->where(function ($query) use ($idNguoi) {
                $query->where('id_nguoi', $idNguoi)
                    ->orWhere('id_nguoi_lien_quan', $idNguoi);
            })
            ->where(function ($query) use ($idHienTai) {
                $query->where('id_nguoi', '!=', $idHienTai)
                    ->where('id_nguoi_lien_quan', '!=', $idHienTai);
            })
            ->exists();
    }
}
