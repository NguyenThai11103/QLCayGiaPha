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
            $idCha = $this->input('id_cha');
            $idMe = $this->input('id_me');

            if ($idCha && $idMe && $this->laToTienCua($idCha, $idMe)) {
                $validator->errors()->add('id_me', 'Cha va me khong duoc la to tien hoac con chau cua nhau.');
            }

            if ($idCha && $idMe && $this->laToTienCua($idMe, $idCha)) {
                $validator->errors()->add('id_cha', 'Cha va me khong duoc la to tien hoac con chau cua nhau.');
            }

            // Kiểm tra cận huyết dưới 4 đời cho vợ chồng cùng dòng họ
            $voChongList = $this->input('id_vo_chong_list') ?? [];
            if ($this->input('id_vo_chong')) {
                $voChongList[] = $this->input('id_vo_chong');
            }

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

                foreach ($voChongList as $idVoChong) {
                    if (isset($map[$idVoChong])) {
                        $nguoiVoChong = $map[$idVoChong];
                        if ((int) $nguoiVoChong['dong_ho_id'] === (int) $this->input('id_dong_ho')) {
                            $ancestorsB = $this->getAncestorDistances($idVoChong, $map);
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

}
