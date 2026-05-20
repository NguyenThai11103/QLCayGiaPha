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

            $ngaySinh = $this->has('ngay_sinh') ? $this->input('ngay_sinh') : $nguoi->ngay_sinh_duong;
            $namSinh = $ngaySinh ? (int) date('Y', strtotime($ngaySinh)) : null;
            $thuTuSinh = $this->has('thu_tu_sinh') ? $this->input('thu_tu_sinh') : $nguoi->thu_tu_sinh;

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

            // 1. Kiểm tra ràng buộc thứ tự sinh giữa các con đẻ
            if ($namSinh !== null && $thuTuSinh !== null && ($idCha || $idMe)) {
                $conKhacsQuery = DB::table('thanh_viens')
                    ->join('quan_hes', 'thanh_viens.id', '=', 'quan_hes.node_2_id')
                    ->where('thanh_viens.id', '!=', $idNguoi);
                
                if ($idCha && $idMe) {
                    $conKhacsQuery->where(function ($q) use ($idCha, $idMe) {
                        $q->where(function ($sub) use ($idCha) {
                            $sub->where('quan_hes.node_1_id', $idCha)
                                ->where('quan_hes.loai_quan_he', 'cha_con');
                        })->orWhere(function ($sub) use ($idMe) {
                            $sub->where('quan_hes.node_1_id', $idMe)
                                ->where('quan_hes.loai_quan_he', 'me_con');
                        });
                    });
                } elseif ($idCha) {
                    $conKhacsQuery->where('quan_hes.node_1_id', $idCha)
                        ->where('quan_hes.loai_quan_he', 'cha_con');
                } else {
                    $conKhacsQuery->where('quan_hes.node_1_id', $idMe)
                        ->where('quan_hes.loai_quan_he', 'me_con');
                }

                $conKhacs = $conKhacsQuery->select('thanh_viens.*')->distinct()->get();

                foreach ($conKhacs as $conKhac) {
                    if ($conKhac->thu_tu_sinh !== null && $conKhac->ngay_sinh_duong !== null) {
                        $namSinhConKhac = (int) date('Y', strtotime($conKhac->ngay_sinh_duong));
                        if ($thuTuSinh > $conKhac->thu_tu_sinh && $namSinh < $namSinhConKhac) {
                            $validator->errors()->add('ngay_sinh', "Con thứ {$thuTuSinh} không thể sinh trước con thứ {$conKhac->thu_tu_sinh} (sinh năm {$namSinhConKhac}).");
                        } elseif ($thuTuSinh < $conKhac->thu_tu_sinh && $namSinh > $namSinhConKhac) {
                            $validator->errors()->add('ngay_sinh', "Con thứ {$thuTuSinh} không thể sinh sau con thứ {$conKhac->thu_tu_sinh} (sinh năm {$namSinhConKhac}).");
                        }
                    }
                }
            }

            // 2. Kiểm tra ràng buộc con không sinh trước hoặc cùng năm với cha/mẹ
            if ($namSinh !== null) {
                if ($idCha) {
                    $cha = DB::table('thanh_viens')->where('id', $idCha)->first();
                    if ($cha && $cha->ngay_sinh_duong !== null) {
                        $namSinhCha = (int) date('Y', strtotime($cha->ngay_sinh_duong));
                        if ($namSinh <= $namSinhCha) {
                            $validator->errors()->add('ngay_sinh', "Người con không thể sinh trước hoặc cùng năm với cha (Cha sinh năm {$namSinhCha}).");
                        }
                    }
                }
                if ($idMe) {
                    $me = DB::table('thanh_viens')->where('id', $idMe)->first();
                    if ($me && $me->ngay_sinh_duong !== null) {
                        $namSinhMe = (int) date('Y', strtotime($me->ngay_sinh_duong));
                        if ($namSinh <= $namSinhMe) {
                            $validator->errors()->add('ngay_sinh', "Người con không thể sinh trước hoặc cùng năm với mẹ (Mẹ sinh năm {$namSinhMe}).");
                        }
                    }
                }
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

            // 3. Kiểm tra ràng buộc dâu/rể không sinh trước hoặc cùng năm với cha mẹ chồng/vợ ("vợ chồng cũng thế")
            if (!empty($voChongList)) {
                $namSinhChaHT = null;
                $namSinhMeHT = null;
                if ($idCha) {
                    $cha = DB::table('thanh_viens')->where('id', $idCha)->first();
                    if ($cha && $cha->ngay_sinh_duong) {
                        $namSinhChaHT = (int) date('Y', strtotime($cha->ngay_sinh_duong));
                    }
                }
                if ($idMe) {
                    $me = DB::table('thanh_viens')->where('id', $idMe)->first();
                    if ($me && $me->ngay_sinh_duong) {
                        $namSinhMeHT = (int) date('Y', strtotime($me->ngay_sinh_duong));
                    }
                }

                foreach ($voChongList as $idVoChongIt) {
                    $voChong = DB::table('thanh_viens')->where('id', $idVoChongIt)->first();
                    if (!$voChong) {
                        continue;
                    }

                    $namSinhVoChong = $voChong->ngay_sinh_duong ? (int) date('Y', strtotime($voChong->ngay_sinh_duong)) : null;

                    // Chiều 1: Vợ/chồng không được sinh trước/cùng năm với cha mẹ của thành viên hiện tại
                    if ($namSinhVoChong !== null) {
                        if ($namSinhChaHT !== null && $namSinhVoChong <= $namSinhChaHT) {
                            $validator->errors()->add('id_vo_chong_list', "Vợ/chồng không thể sinh trước hoặc cùng năm với cha của thành viên (Cha sinh năm {$namSinhChaHT}).");
                        }
                        if ($namSinhMeHT !== null && $namSinhVoChong <= $namSinhMeHT) {
                            $validator->errors()->add('id_vo_chong_list', "Vợ/chồng không thể sinh trước hoặc cùng năm với mẹ của thành viên (Mẹ sinh năm {$namSinhMeHT}).");
                        }
                    }

                    // Chiều 2: Thành viên hiện tại không được sinh trước/cùng năm với cha mẹ của vợ/chồng
                    if ($namSinh !== null) {
                        $chaVoChongQH = DB::table('quan_hes')
                            ->where('node_2_id', $idVoChongIt)
                            ->where('loai_quan_he', 'cha_con')
                            ->first();
                        $meVoChongQH = DB::table('quan_hes')
                            ->where('node_2_id', $idVoChongIt)
                            ->where('loai_quan_he', 'me_con')
                            ->first();

                        if ($chaVoChongQH) {
                            $chaVC = DB::table('thanh_viens')->where('id', $chaVoChongQH->node_1_id)->first();
                            if ($chaVC && $chaVC->ngay_sinh_duong) {
                                $namSinhChaVC = (int) date('Y', strtotime($chaVC->ngay_sinh_duong));
                                if ($namSinh <= $namSinhChaVC) {
                                    $validator->errors()->add('ngay_sinh', "Thành viên không thể sinh trước hoặc cùng năm với cha của vợ/chồng mình (Cha vợ/chồng sinh năm {$namSinhChaVC}).");
                                }
                            }
                        }

                        if ($meVoChongQH) {
                            $meVC = DB::table('thanh_viens')->where('id', $meVoChongQH->node_1_id)->first();
                            if ($meVC && $meVC->ngay_sinh_duong) {
                                $namSinhMeVC = (int) date('Y', strtotime($meVC->ngay_sinh_duong));
                                if ($namSinh <= $namSinhMeVC) {
                                    $validator->errors()->add('ngay_sinh', "Thành viên không thể sinh trước hoặc cùng năm với mẹ của vợ/chồng mình (Mẹ vợ/chồng sinh năm {$namSinhMeVC}).");
                                }
                            }
                        }
                    }
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

    private function nguoiDaCoVoChongKhac(int $idVoChong, int $idNguoi): bool
    {
        $quanHe = DB::table('quan_hes')
            ->where('loai_quan_he', 'vo_chong')
            ->where(function ($query) use ($idVoChong) {
                $query->where('node_1_id', $idVoChong)
                    ->orWhere('node_2_id', $idVoChong);
            })
            ->first();

        if (!$quanHe) {
            return false;
        }

        $partnerId = (int) ($quanHe->node_1_id === $idVoChong ? $quanHe->node_2_id : $quanHe->node_1_id);

        return $partnerId !== $idNguoi;
    }

}
