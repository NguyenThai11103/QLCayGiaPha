<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Nguoi\CreateNguoiRequest;
use App\Http\Requests\Nguoi\DeleteNguoiRequest;
use App\Http\Requests\Nguoi\UpdateNguoiRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class NguoiController extends Controller
{
    public function index(Request $request)
    {
        $idDongHo = $request->query('id_dong_ho');
        $query = DB::table('thanh_viens');

        if ($idDongHo) {
            $query->where('dong_ho_id', $idDongHo);
        }

        $thanhViens = $query->get();
        $data = $this->mapThanhVienToNguoi($thanhViens);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function detail(Request $request)
    {
        $id = $request->query('id');
        if (!$id) {
            return response()->json(['success' => false, 'message' => 'Thieu id']);
        }

        $nguoiDb = DB::table('thanh_viens')->where('id', $id)->first();
        if (!$nguoiDb) {
            return response()->json(['success' => false, 'message' => 'Khong tim thay']);
        }

        $tatCa = DB::table('thanh_viens')->where('dong_ho_id', $nguoiDb->dong_ho_id)->get();
        $tatCaNguoi = $this->mapThanhVienToNguoi($tatCa);

        $map = [];
        foreach ($tatCaNguoi as $n) {
            $map[$n['id']] = $n;
        }

        $nguoi = $map[$id];
        $ketQuaQuanHe = [];

        foreach ($tatCaNguoi as $n) {
            if ($n['id'] === $nguoi['id']) {
                continue;
            }

            $path1 = $this->getPathToRoot($nguoi['id'], $map);
            $path2 = $this->getPathToRoot($n['id'], $map);

            $lcaId = null;
            $dist1 = 0;
            $dist2 = 0;

            foreach ($path1 as $d1 => $p1) {
                $d2 = array_search($p1, $path2, true);
                if ($d2 !== false) {
                    $lcaId = $p1;
                    $dist1 = $d1;
                    $dist2 = $d2;
                    break;
                }
            }

            $xungHo = 'Khong ro';
            if ($lcaId) {
                if ($dist1 === 0) {
                    if ($dist2 === 1) {
                        $xungHo = 'Con';
                    } elseif ($dist2 === 2) {
                        $xungHo = 'Chau';
                    } elseif ($dist2 === 3) {
                        $xungHo = 'Chat';
                    } elseif ($dist2 === 4) {
                        $xungHo = 'Chut';
                    } elseif ($dist2 === 5) {
                        $xungHo = 'Chit';
                    } else {
                        $xungHo = 'Hau due doi thu ' . $dist2;
                    }
                } elseif ($dist2 === 0) {
                    if ($dist1 === 1) {
                        $xungHo = $n['gioi_tinh'] === 'nam' ? 'Cha' : 'Me';
                    } elseif ($dist1 === 2) {
                        $xungHo = $n['gioi_tinh'] === 'nam' ? 'Ong' : 'Ba';
                    } elseif ($dist1 === 3) {
                        $xungHo = 'Cu';
                    } elseif ($dist1 === 4) {
                        $xungHo = 'Ky';
                    } else {
                        $xungHo = 'To tien doi thu ' . $dist1;
                    }
                } else {
                    if ($dist1 === $dist2) {
                        $xungHo = 'Anh/Chi/Em ho';
                    } elseif ($dist1 > $dist2) {
                        $diff = $dist1 - $dist2;
                        $xungHo = $diff === 1
                            ? ($n['gioi_tinh'] === 'nam' ? 'Chu/Bac/Cau' : 'Co/Di/Bac')
                            : 'Ong/Ba ho';
                    } else {
                        $diff = $dist2 - $dist1;
                        $xungHo = $diff === 1 ? 'Chau ho' : 'Chat/Chut ho';
                    }
                }
            }

            $ketQuaQuanHe[] = [
                'nguoi' => $n,
                'xung_ho' => $xungHo,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'thong_tin' => $nguoi,
                'danh_sach_quan_he' => $ketQuaQuanHe,
            ],
        ]);
    }

    public function store(CreateNguoiRequest $request)
    {
        $data = $request->validated();
        $idVoChong = $data['id_vo_chong'] ?? null;
        $idCha = $data['id_cha'] ?? null;
        $idMe = $data['id_me'] ?? null;

        $insertData = [
            'dong_ho_id' => $data['id_dong_ho'],
            'ho_ten' => $data['ten_day_du'],
            'gioi_tinh' => $data['gioi_tinh'],
            'ngay_sinh_duong' => $data['ngay_sinh'] ?? null,
            'tinh_trang_song' => $data['da_mat'] ? 'mat' : 'song',
            'ngay_mat_am' => $data['ngay_mat'] ?? null,
            'tieu_su' => $data['tieu_su'] ?? null,
            'anh_dai_dien' => $data['anh_dai_dien'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        $id = DB::transaction(function () use ($insertData, $idVoChong, $idCha, $idMe) {
            $id = DB::table('thanh_viens')->insertGetId($insertData);
            
            $this->dongBoQuanHeVoChong($id, $idVoChong);
            $this->dongBoQuanHeChaMe($id, $idCha, $idMe);

            return $id;
        });

        return response()->json([
            'success' => true,
            'message' => 'Tao thanh cong',
            'id' => $id,
        ]);
    }

    public function update(UpdateNguoiRequest $request)
    {
        $data = $request->validated();
        $id = $data['id'];

        $updateData = ['updated_at' => now()];
        if (array_key_exists('id_dong_ho', $data)) $updateData['dong_ho_id'] = $data['id_dong_ho'];
        if (array_key_exists('ten_day_du', $data)) $updateData['ho_ten'] = $data['ten_day_du'];
        if (array_key_exists('gioi_tinh', $data)) $updateData['gioi_tinh'] = $data['gioi_tinh'];
        if (array_key_exists('ngay_sinh', $data)) $updateData['ngay_sinh_duong'] = $data['ngay_sinh'];
        if (array_key_exists('da_mat', $data)) {
            $updateData['tinh_trang_song'] = $data['da_mat'] ? 'mat' : 'song';
        }
        if (array_key_exists('ngay_mat', $data)) $updateData['ngay_mat_am'] = $data['ngay_mat'];
        if (array_key_exists('tieu_su', $data)) $updateData['tieu_su'] = $data['tieu_su'];
        if (array_key_exists('anh_dai_dien', $data)) $updateData['anh_dai_dien'] = $data['anh_dai_dien'];

        DB::transaction(function () use ($id, $updateData, $data) {
            if (!empty($updateData)) {
                DB::table('thanh_viens')->where('id', $id)->update($updateData);
            }
            
            if (array_key_exists('id_vo_chong', $data)) {
                $this->dongBoQuanHeVoChong($id, $data['id_vo_chong']);
            }
            
            if (array_key_exists('id_cha', $data) || array_key_exists('id_me', $data)) {
                $chaCon = DB::table('quan_hes')->where('node_2_id', $id)->where('loai_quan_he', 'cha_con')->first();
                $meCon = DB::table('quan_hes')->where('node_2_id', $id)->where('loai_quan_he', 'me_con')->first();
                $idChaHienTai = $chaCon ? $chaCon->node_1_id : null;
                $idMeHienTai = $meCon ? $meCon->node_1_id : null;
                
                $idChaMoi = array_key_exists('id_cha', $data) ? $data['id_cha'] : $idChaHienTai;
                $idMeMoi = array_key_exists('id_me', $data) ? $data['id_me'] : $idMeHienTai;
                $this->dongBoQuanHeChaMe($id, $idChaMoi, $idMeMoi);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Cap nhat thanh cong',
        ]);
    }

    public function destroy(DeleteNguoiRequest $request)
    {
        $data = $request->validated();

        DB::table('thanh_viens')->where('id', $data['id'])->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xoa thanh cong',
        ]);
    }

    private function getPathToRoot($id, array $map): array
    {
        $path = [];
        $currentId = $id;

        while ($currentId && isset($map[$currentId])) {
            $path[] = $currentId;
            $currentId = $map[$currentId]['id_cha'];

            if (in_array($currentId, $path, true)) {
                break;
            }
        }

        return $path;
    }

    private function mapThanhVienToNguoi(Collection $thanhViens): Collection
    {
        if ($thanhViens->isEmpty()) {
            return $thanhViens;
        }

        $ids = $thanhViens->pluck('id');
        
        $quanHes = DB::table('quan_hes')
            ->whereIn('node_1_id', $ids)
            ->orWhereIn('node_2_id', $ids)
            ->get();

        $mapVoChong = [];
        $mapCha = [];
        $mapMe = [];

        foreach ($quanHes as $quanHe) {
            if ($quanHe->loai_quan_he === 'vo_chong') {
                $mapVoChong[$quanHe->node_1_id][] = (int) $quanHe->node_2_id;
                $mapVoChong[$quanHe->node_2_id][] = (int) $quanHe->node_1_id;
            } elseif ($quanHe->loai_quan_he === 'cha_con') {
                $mapCha[$quanHe->node_2_id] = (int) $quanHe->node_1_id;
            } elseif ($quanHe->loai_quan_he === 'me_con') {
                $mapMe[$quanHe->node_2_id] = (int) $quanHe->node_1_id;
            }
        }

        return $thanhViens->map(function ($tv) use ($mapVoChong, $mapCha, $mapMe) {
            return [
                'id' => $tv->id,
                'id_dong_ho' => $tv->dong_ho_id,
                'ten_day_du' => $tv->ho_ten,
                'gioi_tinh' => $tv->gioi_tinh,
                'ngay_sinh' => $tv->ngay_sinh_duong,
                'ngay_mat' => $tv->ngay_mat_am,
                'da_mat' => $tv->tinh_trang_song === 'mat',
                'id_cha' => $mapCha[$tv->id] ?? null,
                'id_me' => $mapMe[$tv->id] ?? null,
                'vo_chong_ids' => array_values(array_unique($mapVoChong[$tv->id] ?? [])),
                'tieu_su' => $tv->tieu_su,
                'anh_dai_dien' => $tv->anh_dai_dien,
            ];
        });
    }

    private function dongBoQuanHeVoChong(int $idNguoi, $idVoChong): void
    {
        DB::table('quan_hes')
            ->where('loai_quan_he', 'vo_chong')
            ->where(function ($query) use ($idNguoi) {
                $query->where('node_1_id', $idNguoi)
                    ->orWhere('node_2_id', $idNguoi);
            })
            ->delete();

        if (!$idVoChong) {
            return;
        }

        // Always put smaller ID as node_1_id for vo_chong to avoid uniqueness issues,
        // though uniqueness is ['node_1_id', 'node_2_id', 'loai_quan_he']
        $node1 = min($idNguoi, $idVoChong);
        $node2 = max($idNguoi, $idVoChong);

        DB::table('quan_hes')->insert([
            'node_1_id' => $node1,
            'node_2_id' => $node2,
            'loai_quan_he' => 'vo_chong',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function dongBoQuanHeChaMe(int $idCon, $idCha, $idMe): void
    {
        DB::table('quan_hes')
            ->where('node_2_id', $idCon)
            ->whereIn('loai_quan_he', ['cha_con', 'me_con'])
            ->delete();

        if ($idCha) {
            DB::table('quan_hes')->insert([
                'node_1_id' => $idCha,
                'node_2_id' => $idCon,
                'loai_quan_he' => 'cha_con',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        if ($idMe) {
            DB::table('quan_hes')->insert([
                'node_1_id' => $idMe,
                'node_2_id' => $idCon,
                'loai_quan_he' => 'me_con',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
