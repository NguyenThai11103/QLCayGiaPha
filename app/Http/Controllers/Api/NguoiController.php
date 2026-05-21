<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Nguoi\CreateNguoiRequest;
use App\Http\Requests\Nguoi\DeleteNguoiRequest;
use App\Http\Requests\Nguoi\UpdateNguoiRequest;
use App\Support\AccessControl;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class NguoiController extends Controller
{
    public function index(Request $request)
    {
        $idDongHo = $request->query('id_dong_ho');
        $query = DB::table('thanh_viens');

        if ($idDongHo && !AccessControl::canAccessFamily($request->user(), $idDongHo)) {
            return AccessControl::forbidden();
        }

        AccessControl::scopeFamilyQuery($query, $request->user());

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

        if (!AccessControl::canAccessFamily($request->user(), $nguoiDb->dong_ho_id)) {
            return AccessControl::forbidden();
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

            $xungHo = $this->tinhXungHoGiuaHaiNguoi($nguoi, $n, $map);

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

        if (!AccessControl::canManageFamily($request->user(), $data['id_dong_ho'])) {
            return AccessControl::forbidden();
        }

        $voChongList = $data['id_vo_chong_list'] ?? [];
        if (isset($data['id_vo_chong']) && $data['id_vo_chong'] !== null) {
            $voChongList[] = $data['id_vo_chong'];
        }
        $voChongList = array_unique($voChongList);

        $idCha = $data['id_cha'] ?? null;
        $idMe = $data['id_me'] ?? null;

        if (!AccessControl::allMembersInFamily(array_merge([$idCha, $idMe], $voChongList), $data['id_dong_ho'])) {
            return AccessControl::invalidScope('Cha, me hoac vo/chong khong thuoc dong ho duoc phep.');
        }

        $insertData = [
            'dong_ho_id' => $data['id_dong_ho'],
            'ho_ten' => $data['ten_day_du'],
            'gioi_tinh' => $data['gioi_tinh'],
            'ngay_sinh_duong' => $data['ngay_sinh'] ?? null,
            'tinh_trang_song' => $data['da_mat'] ? 0 : 1,
            'ngay_mat_am' => $data['ngay_mat'] ?? null,
            'tieu_su' => $data['tieu_su'] ?? null,
            'anh_dai_dien' => $data['anh_dai_dien'] ?? null,
            'thu_tu_sinh' => $data['thu_tu_sinh'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        $id = DB::transaction(function () use ($insertData, $voChongList, $idCha, $idMe) {
            $id = DB::table('thanh_viens')->insertGetId($insertData);

            $this->dongBoQuanHeVoChong($id, $voChongList);
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
        $nguoiDb = DB::table('thanh_viens')->where('id', $id)->first();

        if (!$nguoiDb) {
            return response()->json(['success' => false, 'message' => 'Khong tim thay'], 404);
        }

        if (!AccessControl::canManageFamily($request->user(), $nguoiDb->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        $targetFamilyId = array_key_exists('id_dong_ho', $data) ? (int) $data['id_dong_ho'] : (int) $nguoiDb->dong_ho_id;

        if (!AccessControl::canManageFamily($request->user(), $targetFamilyId)) {
            return AccessControl::forbidden();
        }

        $linkedMemberIds = [];
        foreach (['id_cha', 'id_me', 'id_vo_chong'] as $key) {
            if (array_key_exists($key, $data)) {
                $linkedMemberIds[] = $data[$key];
            }
        }
        if (array_key_exists('id_vo_chong_list', $data)) {
            $linkedMemberIds = array_merge($linkedMemberIds, $data['id_vo_chong_list'] ?? []);
        }

        if (!AccessControl::allMembersInFamily($linkedMemberIds, $targetFamilyId)) {
            return AccessControl::invalidScope('Quan he duoc chon khong thuoc dong ho duoc phep.');
        }

        $updateData = ['updated_at' => now()];
        if (array_key_exists('id_dong_ho', $data)) $updateData['dong_ho_id'] = $data['id_dong_ho'];
        if (array_key_exists('ten_day_du', $data)) $updateData['ho_ten'] = $data['ten_day_du'];
        if (array_key_exists('gioi_tinh', $data)) $updateData['gioi_tinh'] = $data['gioi_tinh'];
        if (array_key_exists('ngay_sinh', $data)) $updateData['ngay_sinh_duong'] = $data['ngay_sinh'];
        if (array_key_exists('da_mat', $data)) {
            $updateData['tinh_trang_song'] = $data['da_mat'] ? 0 : 1;
        }
        if (array_key_exists('ngay_mat', $data)) $updateData['ngay_mat_am'] = $data['ngay_mat'];
        if (array_key_exists('tieu_su', $data)) $updateData['tieu_su'] = $data['tieu_su'];
        if (array_key_exists('anh_dai_dien', $data)) $updateData['anh_dai_dien'] = $data['anh_dai_dien'];
        if (array_key_exists('thu_tu_sinh', $data)) $updateData['thu_tu_sinh'] = $data['thu_tu_sinh'];

        DB::transaction(function () use ($id, $updateData, $data) {
            if (!empty($updateData)) {
                DB::table('thanh_viens')->where('id', $id)->update($updateData);
            }

            if (array_key_exists('id_vo_chong_list', $data) || array_key_exists('id_vo_chong', $data)) {
                $voChongList = $data['id_vo_chong_list'] ?? [];
                if (isset($data['id_vo_chong']) && $data['id_vo_chong'] !== null) {
                    $voChongList[] = $data['id_vo_chong'];
                }
                $this->dongBoQuanHeVoChong($id, array_unique($voChongList));
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
        $nguoiDb = DB::table('thanh_viens')->where('id', $data['id'])->first();

        if (!$nguoiDb) {
            return response()->json(['success' => false, 'message' => 'Khong tim thay'], 404);
        }

        if (!AccessControl::canManageFamily($request->user(), $nguoiDb->dong_ho_id)) {
            return AccessControl::forbidden();
        }

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

    private function tinhXungHoGiuaHaiNguoi(array $nguoi, array $nguoiKhac, array $map): string
    {
        if (in_array($nguoiKhac['id'], $nguoi['vo_chong_ids'] ?? [], true)) {
            return $nguoi['gioi_tinh'] === 'nam' ? 'Vợ' : 'Chồng';
        }

        $distance = $this->getBloodDistance($nguoi['id'], $nguoiKhac['id'], $map);

        if (!$distance) {
            return $this->tinhVoChongCuaToTienTrucHe($nguoi, $nguoiKhac, $map)
                ?? $this->tinhQuanHeThongGiaTrucHe($nguoi, $nguoiKhac, $map)
                ?? 'Khong ro';
        }

        $dist1 = $distance['dA'];
        $dist2 = $distance['dB'];

        if ($dist1 === 0) {
            if ($dist2 === 1) {
                return 'Con';
            } elseif ($dist2 === 2) {
                return 'Chau';
            } elseif ($dist2 === 3) {
                return 'Chat';
            } elseif ($dist2 === 4) {
                return 'Chut';
            } elseif ($dist2 === 5) {
                return 'Chit';
            }

            return 'Hau due doi thu ' . $dist2;
        }

        if ($dist2 === 0) {
            if ($dist1 === 1) {
                return $nguoiKhac['gioi_tinh'] === 'nam' ? 'Cha' : 'Me';
            } elseif ($dist1 === 2) {
                return $nguoiKhac['gioi_tinh'] === 'nam' ? 'Ong' : 'Ba';
            } elseif ($dist1 === 3) {
                return 'Cu';
            } elseif ($dist1 === 4) {
                return 'Ky';
            }

            return 'To tien doi thu ' . $dist1;
        }

        if ($dist1 === $dist2) {
            return 'Anh/Chi/Em ho';
        }

        if ($dist1 > $dist2) {
            $diff = $dist1 - $dist2;

            return $diff === 1
                ? ($nguoiKhac['gioi_tinh'] === 'nam' ? 'Chu/Bac/Cau' : 'Co/Di/Bac')
                : 'Ong/Ba ho';
        }

        $diff = $dist2 - $dist1;

        return $diff === 1 ? 'Chau ho' : 'Chat/Chut ho';
    }

    private function getBloodDistance($idA, $idB, array $map): ?array
    {
        $ancestorsA = $this->getAncestorDistances($idA, $map);
        $ancestorsB = $this->getAncestorDistances($idB, $map);
        $best = null;

        foreach ($ancestorsA as $ancestorId => $dA) {
            if (!array_key_exists($ancestorId, $ancestorsB)) {
                continue;
            }

            $dB = $ancestorsB[$ancestorId];
            if (!$best || $dA + $dB < $best['dA'] + $best['dB']) {
                $best = [
                    'lcaId' => $ancestorId,
                    'dA' => $dA,
                    'dB' => $dB,
                ];
            }
        }

        return $best;
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
            foreach ([$map[$currentId]['id_cha'], $map[$currentId]['id_me']] as $parentId) {
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

    private function tinhVoChongCuaToTienTrucHe(array $nguoi, array $nguoiKhac, array $map): ?string
    {
        foreach ($nguoiKhac['vo_chong_ids'] ?? [] as $idVoChongNguoiKhac) {
            $voChongNguoiKhac = $map[$idVoChongNguoiKhac] ?? null;
            if (!$voChongNguoiKhac) {
                continue;
            }

            $distance = $this->getBloodDistance($nguoi['id'], $voChongNguoiKhac['id'], $map);
            if (($distance['dB'] ?? null) === 0 && ($distance['dA'] ?? 0) >= 1) {
                return $this->ancestorLabel($nguoiKhac, $distance['dA']);
            }
        }

        foreach ($nguoi['vo_chong_ids'] ?? [] as $idVoChongNguoi) {
            $voChongNguoi = $map[$idVoChongNguoi] ?? null;
            if (!$voChongNguoi) {
                continue;
            }

            $distance = $this->getBloodDistance($nguoiKhac['id'], $voChongNguoi['id'], $map);
            if (($distance['dB'] ?? null) === 0 && ($distance['dA'] ?? 0) >= 1) {
                return $this->descendantLabel($distance['dA']);
            }
        }

        return null;
    }

    private function tinhQuanHeThongGiaTrucHe(array $nguoi, array $nguoiKhac, array $map): ?string
    {
        foreach ($nguoiKhac['vo_chong_ids'] ?? [] as $idVoChongNguoiKhac) {
            $voChongNguoiKhac = $map[$idVoChongNguoiKhac] ?? null;
            if (!$voChongNguoiKhac) {
                continue;
            }

            $distance = $this->getBloodDistance($nguoi['id'], $voChongNguoiKhac['id'], $map);
            if (($distance['dA'] ?? null) === 0 && ($distance['dB'] ?? null) === 1) {
                return $this->childInLawLabel($voChongNguoiKhac) . ' của ' . $nguoi['ten_day_du'];
            }
        }

        foreach ($nguoi['vo_chong_ids'] ?? [] as $idVoChongNguoi) {
            $voChongNguoi = $map[$idVoChongNguoi] ?? null;
            if (!$voChongNguoi) {
                continue;
            }

            $distance = $this->getBloodDistance($nguoiKhac['id'], $voChongNguoi['id'], $map);
            if (($distance['dA'] ?? null) === 0 && ($distance['dB'] ?? null) === 1) {
                return $this->parentInLawLabel($nguoiKhac, $voChongNguoi) . ' của ' . $nguoi['ten_day_du'];
            }
        }

        return null;
    }

    private function parentInLawLabel(array $parent, array $spouse): string
    {
        $parentLabel = $parent['gioi_tinh'] === 'nam' ? 'cha' : 'mẹ';
        $side = $spouse['gioi_tinh'] === 'nam' ? 'chồng' : 'vợ';

        return $parentLabel . ' ' . $side;
    }

    private function childInLawLabel(array $spouse): string
    {
        return $spouse['gioi_tinh'] === 'nam' ? 'con dâu' : 'con rể';
    }

    private function ancestorLabel(array $person, int $distance): string
    {
        if ($distance === 1) {
            return $person['gioi_tinh'] === 'nam' ? 'Cha' : 'Me';
        } elseif ($distance === 2) {
            return $person['gioi_tinh'] === 'nam' ? 'Ong' : 'Ba';
        } elseif ($distance === 3) {
            return 'Cu';
        } elseif ($distance === 4) {
            return 'Ky';
        }

        return 'To tien doi thu ' . $distance;
    }

    private function descendantLabel(int $distance): string
    {
        if ($distance === 1) {
            return 'Con';
        } elseif ($distance === 2) {
            return 'Chau';
        } elseif ($distance === 3) {
            return 'Chat';
        } elseif ($distance === 4) {
            return 'Chut';
        } elseif ($distance === 5) {
            return 'Chit';
        }

        return 'Hau due doi thu ' . $distance;
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
                'da_mat' => (int) $tv->tinh_trang_song === 0,
                'id_cha' => $mapCha[$tv->id] ?? null,
                'id_me' => $mapMe[$tv->id] ?? null,
                'vo_chong_ids' => array_values(array_unique($mapVoChong[$tv->id] ?? [])),
                'tieu_su' => $tv->tieu_su,
                'anh_dai_dien' => $tv->anh_dai_dien,
            ];
        });
    }

    private function dongBoQuanHeVoChong(int $idNguoi, array $idVoChongList): void
    {
        // Tìm các quan hệ cũ để check xem cái nào cần xóa, cái nào cần thêm
        $quanHeCus = DB::table('quan_hes')
            ->where('loai_quan_he', 'vo_chong')
            ->where(function ($query) use ($idNguoi) {
                $query->where('node_1_id', $idNguoi)
                    ->orWhere('node_2_id', $idNguoi);
            })
            ->get();

        // ID các người vợ/chồng cũ
        $idVuChongCus = $quanHeCus->map(function ($qh) use ($idNguoi) {
            return $qh->node_1_id == $idNguoi ? $qh->node_2_id : $qh->node_1_id;
        })->toArray();

        // Các thành viên mới được thêm
        $idsAdd = array_diff($idVoChongList, $idVuChongCus);
        // Các thành viên bị xoá bỏ khỏi danh sách
        $idsRemove = array_diff($idVuChongCus, $idVoChongList);

        // 1. Thực hiện xoá
        if (!empty($idsRemove)) {
            DB::table('quan_hes')
                ->where('loai_quan_he', 'vo_chong')
                ->where(function ($q) use ($idNguoi, $idsRemove) {
                    $q->where('node_1_id', $idNguoi)->whereIn('node_2_id', $idsRemove);
                })->orWhere(function ($q) use ($idNguoi, $idsRemove) {
                    $q->where('node_2_id', $idNguoi)->whereIn('node_1_id', $idsRemove);
                })->delete();
        }

        // 2. Thực hiện thêm
        $insertBatches = [];
        foreach ($idsAdd as $idVoChongMoi) {
            $insertBatches[] = [
                'node_1_id' => min($idNguoi, $idVoChongMoi),
                'node_2_id' => max($idNguoi, $idVoChongMoi),
                'loai_quan_he' => 'vo_chong',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!empty($insertBatches)) {
            DB::table('quan_hes')->insert($insertBatches);
        }
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
