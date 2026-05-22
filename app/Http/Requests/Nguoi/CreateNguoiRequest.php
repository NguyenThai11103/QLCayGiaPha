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
            $ngaySinh = $this->input('ngay_sinh');
            $namSinh = $ngaySinh ? (int) date('Y', strtotime($ngaySinh)) : null;
            $thuTuSinh = $this->input('thu_tu_sinh');

            if ($idCha && $idMe && $this->laToTienCua($idCha, $idMe)) {
                $validator->errors()->add('id_me', 'Cha va me khong duoc la to tien hoac con chau cua nhau.');
            }

            if ($idCha && $idMe && $this->laToTienCua($idMe, $idCha)) {
                $validator->errors()->add('id_cha', 'Cha va me khong duoc la to tien hoac con chau cua nhau.');
            }

            // 1. Kiểm tra ràng buộc thứ tự sinh giữa các con đẻ
            if ($namSinh !== null && $thuTuSinh !== null && ($idCha || $idMe)) {
                $conKhacsQuery = DB::table('thanh_viens')
                    ->join('quan_hes', 'thanh_viens.id', '=', 'quan_hes.node_2_id');
                
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

            // Kiểm tra cận huyết dưới 4 đời cho vợ chồng cùng dòng họ
            $voChongList = $this->input('id_vo_chong_list') ?? [];
            if ($this->input('id_vo_chong')) {
                $voChongList[] = $this->input('id_vo_chong');
            }
            $voChongList = array_unique(array_filter($voChongList));

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

                foreach ($voChongList as $idVoChong) {
                    $voChong = DB::table('thanh_viens')->where('id', $idVoChong)->first();
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
                            ->where('node_2_id', $idVoChong)
                            ->where('loai_quan_he', 'cha_con')
                            ->first();
                        $meVoChongQH = DB::table('quan_hes')
                            ->where('node_2_id', $idVoChong)
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

            // 4. Kiểm tra ràng buộc hai người trong họ (trực hệ) không thể là vợ chồng của nhau
            if (!empty($voChongList)) {
                $map = $this->getThanhVienMap();
                
                // Thành viên hiện tại có phải là trực hệ không?
                $hienTaiLaTrucHie = ($idCha || $idMe);
                
                if ($hienTaiLaTrucHie) {
                    foreach ($voChongList as $idVoChong) {
                        if (isset($map[$idVoChong])) {
                            $nguoiVoChong = $map[$idVoChong];
                            $voChongLaTrucHie = ($nguoiVoChong['id_cha'] !== null || $nguoiVoChong['id_me'] !== null);
                            
                            if ($voChongLaTrucHie) {
                                $validator->errors()->add('id_vo_chong_list', "Hai người thuộc huyết thống trực hệ của dòng họ (trong họ) không thể là vợ chồng của nhau (Thành viên hiện tại và {$nguoiVoChong['ten_day_du']} đều có cha/mẹ trong dòng họ).");
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
