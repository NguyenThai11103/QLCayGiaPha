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
        $query = DB::table('nguois');

        if ($idDongHo) {
            $query->where('id_dong_ho', $idDongHo);
        }

        $data = $this->ganQuanHeVoChong($query->get());

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

        $nguoi = DB::table('nguois')->where('id', $id)->first();
        if (!$nguoi) {
            return response()->json(['success' => false, 'message' => 'Khong tim thay']);
        }

        $tatCa = DB::table('nguois')->where('id_dong_ho', $nguoi->id_dong_ho)->get();

        $map = [];
        foreach ($tatCa as $n) {
            $map[$n->id] = $n;
        }

        $ketQuaQuanHe = [];

        foreach ($tatCa as $n) {
            if ($n->id === $nguoi->id) {
                continue;
            }

            $path1 = $this->getPathToRoot($nguoi->id, $map);
            $path2 = $this->getPathToRoot($n->id, $map);

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
                        $xungHo = $n->gioi_tinh === 'nam' ? 'Cha' : 'Me';
                    } elseif ($dist1 === 2) {
                        $xungHo = $n->gioi_tinh === 'nam' ? 'Ong' : 'Ba';
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
                            ? ($n->gioi_tinh === 'nam' ? 'Chu/Bac/Cau' : 'Co/Di/Bac')
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
        unset($data['id_vo_chong']);

        $id = DB::transaction(function () use ($data, $idVoChong) {
            $data['created_at'] = now();
            $data['updated_at'] = now();

            $id = DB::table('nguois')->insertGetId($data);
            $this->dongBoQuanHeVoChong($id, $idVoChong);

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
        $idVoChong = $data['id_vo_chong'] ?? null;
        unset($data['id'], $data['id_vo_chong']);
        $data['updated_at'] = now();

        DB::transaction(function () use ($id, $data, $idVoChong) {
            DB::table('nguois')->where('id', $id)->update($data);
            $this->dongBoQuanHeVoChong($id, $idVoChong);
        });

        return response()->json([
            'success' => true,
            'message' => 'Cap nhat thanh cong',
        ]);
    }

    public function destroy(DeleteNguoiRequest $request)
    {
        $data = $request->validated();

        DB::table('nguois')->where('id', $data['id'])->delete();

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
            $currentId = $map[$currentId]->id_cha;

            if (in_array($currentId, $path, true)) {
                break;
            }
        }

        return $path;
    }

    private function ganQuanHeVoChong(Collection $nguoiCollection): Collection
    {
        if ($nguoiCollection->isEmpty()) {
            return $nguoiCollection;
        }

        $ids = $nguoiCollection->pluck('id');
        $quanHeVoChong = DB::table('quan_hes')
            ->where('loai', 'vo_chong')
            ->whereIn('id_nguoi', $ids)
            ->whereIn('id_nguoi_lien_quan', $ids)
            ->get();

        $mapVoChong = [];
        foreach ($quanHeVoChong as $quanHe) {
            $mapVoChong[$quanHe->id_nguoi][] = (int) $quanHe->id_nguoi_lien_quan;
            $mapVoChong[$quanHe->id_nguoi_lien_quan][] = (int) $quanHe->id_nguoi;
        }

        return $nguoiCollection->map(function ($nguoi) use ($mapVoChong) {
            $nguoi->vo_chong_ids = array_values(array_unique($mapVoChong[$nguoi->id] ?? []));

            return $nguoi;
        });
    }

    private function dongBoQuanHeVoChong(int $idNguoi, $idVoChong): void
    {
        DB::table('quan_hes')
            ->where('loai', 'vo_chong')
            ->where(function ($query) use ($idNguoi) {
                $query->where('id_nguoi', $idNguoi)
                    ->orWhere('id_nguoi_lien_quan', $idNguoi);
            })
            ->delete();

        if (!$idVoChong) {
            return;
        }

        DB::table('quan_hes')->insert([
            'id_nguoi' => $idNguoi,
            'id_nguoi_lien_quan' => $idVoChong,
            'loai' => 'vo_chong',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
