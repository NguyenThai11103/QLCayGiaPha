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
            'id' => 'required|integer|exists:thanh_viens,id',
            'id_dong_ho' => 'sometimes|integer|exists:dong_hos,id',
            'ten_day_du' => 'sometimes|string|max:255',
            'gioi_tinh' => 'sometimes|string|in:nam,nu',
            'ngay_sinh' => 'nullable|date',
            'da_mat' => 'sometimes|boolean',
            'ngay_mat' => 'nullable|date',
            'id_cha' => 'nullable|integer|exists:thanh_viens,id',
            'id_me' => 'nullable|integer|exists:thanh_viens,id',
            'id_vo_chong' => 'nullable|integer|exists:thanh_viens,id',
            'id_vo_chong_list' => 'nullable|array',
            'id_vo_chong_list.*' => 'integer|exists:thanh_viens,id',
            'tieu_su' => 'nullable|string',
            'anh_dai_dien' => 'nullable|string',
            'thu_tu_sinh' => 'nullable|integer|min:1',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $nguoi = DB::table('thanh_viens')->where('id', $this->input('id'))->first();

            if (!$nguoi) {
                return;
            }

            $idNguoi = (int) $this->input('id');
            $idDongHo = $this->has('id_dong_ho') ? (int) $this->input('id_dong_ho') : (int) $nguoi->dong_ho_id;

            $chaCon = DB::table('quan_hes')
                ->where('node_2_id', $idNguoi)
                ->where('loai_quan_he', 'cha_con')
                ->first();
            $meCon = DB::table('quan_hes')
                ->where('node_2_id', $idNguoi)
                ->where('loai_quan_he', 'me_con')
                ->first();

            $idChaHienTai = $chaCon ? $chaCon->node_1_id : null;
            $idMeHienTai = $meCon ? $meCon->node_1_id : null;

            $idCha = $this->has('id_cha') ? $this->input('id_cha') : $idChaHienTai;
            $idMe = $this->has('id_me') ? $this->input('id_me') : $idMeHienTai;
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

            $voChongList = $this->input('id_vo_chong_list') ?? [];
            if ($idVoChong) {
                $voChongList[] = $idVoChong;
            }
            $voChongList = array_unique(array_filter($voChongList));

            if ($idVoChong) {
                if ($this->nguoiDaCoVoChongKhac($idVoChong, $idNguoi)) {
                    $validator->errors()->add('id_vo_chong', 'Thanh vien duoc chon da co vo hoac chong.');
                }
            }

            // Kiểm tra cận huyết dưới 4 đời cho vợ chồng cùng dòng họ
            if (!empty($voChongList) && ($idCha || $idMe)) {
                $map = $this->getThanhVienMap();
                $ancestorsA = [];
                if ($idCha) {
                    $distCha = $this->getAncestorDistances($idCha, $map);
                    foreach ($distCha as $ancId => $d) {
                        $ancestorsA[$ancId] = $d + 1;
                    }
                }
                if ($idMe) {
                    $distMe = $this->getAncestorDistances($idMe, $map);
                    foreach ($distMe as $ancId => $d) {
                        if (!isset($ancestorsA[$ancId]) || $d + 1 < $ancestorsA[$ancId]) {
                            $ancestorsA[$ancId] = $d + 1;
                        }
                    }
                }

                foreach ($voChongList as $voChongId) {
                    if (isset($map[$voChongId])) {
                        $nguoiVoChong = $map[$voChongId];
                        if ((int) $nguoiVoChong['dong_ho_id'] === (int) $idDongHo) {
                            $ancestorsB = $this->getAncestorDistances($voChongId, $map);
                            $best = null;
                            foreach ($ancestorsA as $ancestorId => $dA) {
                                if (isset($ancestorsB[$ancestorId])) {
                                    $dB = $ancestorsB[$ancestorId];
                                    if (!$best || $dA + $dB < $best['dA'] + $best['dB']) {
                                        $best = [
                                            'dA' => $dA,
                                            'dB' => $dB,
                                        ];
                                    }
                                }
                            }

                            if ($best) {
                                $soDoi = max($best['dA'], $best['dB']) + 1;
                                if ($soDoi < 4) {
                                    $validator->errors()->add('id_vo_chong_list', "Vợ chồng thuộc cùng dòng họ phải cách nhau từ 4 đời trở lên theo quy định (hiện tại hai người có quan hệ ở đời thứ {$soDoi}).");
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    private function getThanhVienMap(): array
    {
        $thanhViens = DB::table('thanh_viens')->get();
        $quanHes = DB::table('quan_hes')->get();

        $mapCha = [];
        $mapMe = [];
        foreach ($quanHes as $qh) {
            if ($qh->loai_quan_he === 'cha_con') {
                $mapCha[$qh->node_2_id] = (int) $qh->node_1_id;
            } elseif ($qh->loai_quan_he === 'me_con') {
                $mapMe[$qh->node_2_id] = (int) $qh->node_1_id;
            }
        }

        $map = [];
        foreach ($thanhViens as $tv) {
            $map[$tv->id] = [
                'id' => $tv->id,
                'dong_ho_id' => $tv->dong_ho_id,
                'ten_day_du' => $tv->ho_ten,
                'gioi_tinh' => $tv->gioi_tinh,
                'id_cha' => $mapCha[$tv->id] ?? null,
                'id_me' => $mapMe[$tv->id] ?? null,
            ];
        }

        return $map;
    }

    private function getAncestorDistances($id, array $map): array
    {
        $distances = [];
        $queue = [['id' => $id, 'distance' => 0]];

        while ($queue) {
            $current = array_shift($queue);
            $currentId = $current['id'];

            if (!$currentId || isset($distances[$currentId]) || !isset($map[$currentId])) {
                continue;
            }

            $distances[$currentId] = $current['distance'];
            $person = $map[$currentId];
            
            foreach ([$person['id_cha'], $person['id_me']] as $parentId) {
                if ($parentId) {
                    $queue[] = [
                        'id' => $parentId,
                        'distance' => $current['distance'] + 1,
                    ];
                }
            }
        }

        return $distances;
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

            $chaCon = DB::table('quan_hes')
                ->where('node_2_id', $idHienTai)
                ->where('loai_quan_he', 'cha_con')
                ->first();

            $meCon = DB::table('quan_hes')
                ->where('node_2_id', $idHienTai)
                ->where('loai_quan_he', 'me_con')
                ->first();

            $idCha = $chaCon ? (int) $chaCon->node_1_id : null;
            $idMe = $meCon ? (int) $meCon->node_1_id : null;

            if ($idCha === $idToTien || $idMe === $idToTien) {
                return true;
            }

            if ($idCha) {
                $hangDoi[] = $idCha;
            }

            if ($idMe) {
                $hangDoi[] = $idMe;
            }
        }

        return false;
    }

    private function layVoChongHienTai(int $idNguoi): ?int
    {
        $quanHe = DB::table('quan_hes')
            ->where('loai_quan_he', 'vo_chong')
            ->where(function ($query) use ($idNguoi) {
                $query->where('node_1_id', $idNguoi)
                    ->orWhere('node_2_id', $idNguoi);
            })
            ->first();

        if (!$quanHe) {
            return null;
        }

        return (int) ($quanHe->node_1_id === $idNguoi ? $quanHe->node_2_id : $quanHe->node_1_id);
    }

}
