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
            $query->where(function ($q) use ($idDongHo) {
                $q->where('thanh_viens.dong_ho_id', $idDongHo)
                  ->orWhereExists(function ($sub) use ($idDongHo) {
                      $sub->select(DB::raw(1))
                          ->from('quan_hes')
                          ->where(function($qh) {
                              $qh->whereColumn('quan_hes.node_1_id', 'thanh_viens.id')
                                 ->orWhereColumn('quan_hes.node_2_id', 'thanh_viens.id');
                          })
                          ->whereExists(function ($inClan) use ($idDongHo) {
                              $inClan->select(DB::raw(1))
                                     ->from('thanh_viens as tv2')
                                     ->where('tv2.dong_ho_id', $idDongHo)
                                     ->whereRaw('(quan_hes.node_1_id = tv2.id OR quan_hes.node_2_id = tv2.id)');
                          });
                  });
            });
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

        $query = DB::table('thanh_viens');
        $idDongHo = $nguoiDb->dong_ho_id;
        $query->where(function ($q) use ($idDongHo) {
            $q->where('thanh_viens.dong_ho_id', $idDongHo)
              ->orWhereExists(function ($sub) use ($idDongHo) {
                  $sub->select(DB::raw(1))
                      ->from('quan_hes')
                      ->where(function($qh) {
                          $qh->whereColumn('quan_hes.node_1_id', 'thanh_viens.id')
                             ->orWhereColumn('quan_hes.node_2_id', 'thanh_viens.id');
                      })
                      ->whereExists(function ($inClan) use ($idDongHo) {
                          $inClan->select(DB::raw(1))
                                 ->from('thanh_viens as tv2')
                                 ->where('tv2.dong_ho_id', $idDongHo)
                                 ->whereRaw('(quan_hes.node_1_id = tv2.id OR quan_hes.node_2_id = tv2.id)');
                      });
              });
        });
        $tatCa = $query->get();
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

    /**
     * Tra cứu thông tin cơ bản thành viên qua QR code.
     * Không kiểm tra quyền dòng họ — bất kỳ thành viên đã đăng nhập đều có thể tra.
     */
    public function qrDetail(Request $request)
    {
        $id = $request->query('id');
        if (!$id) {
            return response()->json(['success' => false, 'message' => 'Thiếu id thành viên.'], 422);
        }

        $tv = DB::table('thanh_viens')->where('id', $id)->first();
        if (!$tv) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy thành viên trong hệ thống.'], 404);
        }

        // Lấy tên dòng họ
        $dongHo = DB::table('dong_hos')->where('id', $tv->dong_ho_id)->value('ten_dong_ho');

        // Xử lý ngày âm lịch
        $ngaySinhAmFormatted = null;
        if ($tv->ngay_sinh_am) {
            try {
                $carbonAm = \Carbon\Carbon::parse($tv->ngay_sinh_am);
                $ngaySinhAmFormatted = \App\Support\LunarSolarConverter::formatLunarDate($carbonAm->day, $carbonAm->month, $carbonAm->year);
            } catch (\Exception $e) {}
        }

        $ngayMatAmFormatted = null;
        if ($tv->ngay_mat_am) {
            try {
                $carbonMat = \Carbon\Carbon::parse($tv->ngay_mat_am);
                $ngayMatAmFormatted = \App\Support\LunarSolarConverter::formatLunarDate($carbonMat->day, $carbonMat->month, $carbonMat->year);
            } catch (\Exception $e) {}
        }

        // Quan hệ cha/mẹ/vợ chồng
        $quanHes = DB::table('quan_hes')
            ->where('node_1_id', $id)
            ->orWhere('node_2_id', $id)
            ->get();

        $idCha = null; $idMe = null; $voChongIds = [];
        foreach ($quanHes as $qh) {
            if ($qh->loai_quan_he === 'cha_con') {
                if ($qh->node_1_id == $id) {} else { $idCha = (int) $qh->node_1_id; }
            } elseif ($qh->loai_quan_he === 'me_con') {
                if ($qh->node_1_id == $id) {} else { $idMe = (int) $qh->node_1_id; }
            } elseif ($qh->loai_quan_he === 'vo_chong') {
                $voChongIds[] = $qh->node_1_id == $id ? (int) $qh->node_2_id : (int) $qh->node_1_id;
            }
        }

        $thongTin = [
            'id'                    => $tv->id,
            'id_dong_ho'            => $tv->dong_ho_id,
            'ten_day_du'            => $tv->ho_ten,
            'gioi_tinh'             => $tv->gioi_tinh,
            'ngay_sinh'             => $tv->ngay_sinh_duong,
            'ngay_sinh_am'          => $tv->ngay_sinh_am,
            'ngay_sinh_am_formatted' => $ngaySinhAmFormatted,
            'ngay_mat'              => $tv->ngay_mat_am,
            'ngay_mat_formatted'    => $ngayMatAmFormatted,
            'da_mat'                => in_array($tv->tinh_trang_song, [0, '0', 'mat'], true),
            'id_cha'                => $idCha,
            'id_me'                 => $idMe,
            'vo_chong_ids'          => array_values(array_unique($voChongIds)),
            'tieu_su'               => $tv->tieu_su,
            'anh_dai_dien'          => $tv->anh_dai_dien,
            'dong_ho'               => $dongHo,
        ];

        return response()->json([
            'success' => true,
            'data'    => ['thong_tin' => $thongTin],
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
        $idCon = $data['id_con'] ?? null;
        $conDb = null;

        if ($idCon) {
            if (!AccessControl::allMembersInFamily([$idCon], $data['id_dong_ho'])) {
                return AccessControl::invalidScope('Con khong thuoc dong ho duoc phep.');
            }
            $conDb = DB::table('thanh_viens')->where('id', $idCon)->first();
            if (!$conDb) {
                return response()->json(['success' => false, 'message' => 'Không tìm thấy con hợp lệ.'], 404);
            }
            if ((int) $conDb->doi_thu !== 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chi co the them cha/me cho thanh vien dang o doi 1.',
                ], 422);
            }
        } else {
            if (!AccessControl::allMembersInFamily(array_merge([$idCha, $idMe], $voChongList), $data['id_dong_ho'])) {
                return AccessControl::invalidScope('Cha, me hoac vo/chong khong thuoc dong ho duoc phep.');
            }
        }

        $doiThu = 1;
        if ($idCon && $conDb) {
            $doiThu = 1;
        } elseif ($idCha) {
            $parentDoi = DB::table('thanh_viens')->where('id', $idCha)->value('doi_thu');
            if ($parentDoi !== null) {
                $doiThu = $parentDoi + 1;
            }
        } elseif ($idMe) {
            $parentDoi = DB::table('thanh_viens')->where('id', $idMe)->value('doi_thu');
            if ($parentDoi !== null) {
                $doiThu = $parentDoi + 1;
            }
        } elseif (!empty($voChongList)) {
            $spouseId = reset($voChongList);
            $spouseDoi = DB::table('thanh_viens')->where('id', $spouseId)->value('doi_thu');
            if ($spouseDoi !== null) {
                $doiThu = $spouseDoi;
            }
        }

        $ngaySinhAm = null;
        if (!empty($data['ngay_sinh'])) {
            $lunarConversion = \App\Support\LunarSolarConverter::solarToLunar($data['ngay_sinh']);
            $ngaySinhAm = sprintf('%04d-%02d-%02d', $lunarConversion['year'], $lunarConversion['month'], $lunarConversion['day']);
        }

        $insertData = [
            'dong_ho_id'      => $data['id_dong_ho'],
            'ho_ten'          => $data['ten_day_du'],
            'gioi_tinh'       => $data['gioi_tinh'],
            'ngay_sinh_duong' => $data['ngay_sinh'] ?? null,
            'ngay_sinh_am'    => $ngaySinhAm,
            'tinh_trang_song' => $data['da_mat'] ? 0 : 1,
            'ngay_mat_am'     => $data['ngay_mat'] ?? null,
            'tieu_su'         => $data['tieu_su'] ?? null,
            'anh_dai_dien'    => $data['anh_dai_dien'] ?? null,
            'thu_tu_sinh'     => $data['thu_tu_sinh'] ?? null,
            'doi_thu'         => $doiThu,
            'created_at'      => now(),
            'updated_at'      => now(),
        ];

        $id = DB::transaction(function () use ($insertData, $voChongList, $idCha, $idMe, $idCon) {
            if ($idCon) {
                DB::table('thanh_viens')->where('dong_ho_id', $insertData['dong_ho_id'])->increment('doi_thu');
            }

            $id = DB::table('thanh_viens')->insertGetId($insertData);

            if ($idCon) {
                DB::table('quan_hes')->insert([
                    'node_1_id' => $id,
                    'node_2_id' => $idCon,
                    'loai_quan_he' => $insertData['gioi_tinh'] === 'nam' ? 'cha_con' : 'me_con',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $this->dongBoQuanHeChaMe($id, $idCha, $idMe);
            }

            $this->dongBoQuanHeVoChong($id, $voChongList);

            if (!$idCon) {
                $this->capNhatDoiThuDeQuy($id, $insertData['doi_thu']);
            }

            // Ghi nhận nhật ký gia phả khi tạo mới
            \App\Models\NhatKyGiaPha::create([
                'dong_ho_id' => $insertData['dong_ho_id'],
                'thanh_vien_id' => $id,
                'nguoi_thuc_hien_id' => auth()->id(),
                'hanh_dong' => 'create',
                'du_lieu_cu' => null,
                'du_lieu_moi' => array_merge($insertData, [
                    'id' => $id,
                    'id_cha' => $idCon ? null : $idCha,
                    'id_me' => $idCon ? null : $idMe,
                    'vo_chong_ids' => $voChongList,
                ]),
                'mo_ta' => 'Thêm thành viên mới "' . $insertData['ho_ten'] . '"',
                'created_at' => now(),
            ]);

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
        if (array_key_exists('ngay_sinh', $data)) {
            $updateData['ngay_sinh_duong'] = $data['ngay_sinh'];
            if (!empty($data['ngay_sinh'])) {
                $lunarConversion = \App\Support\LunarSolarConverter::solarToLunar($data['ngay_sinh']);
                $updateData['ngay_sinh_am'] = sprintf('%04d-%02d-%02d', $lunarConversion['year'], $lunarConversion['month'], $lunarConversion['day']);
            } else {
                $updateData['ngay_sinh_am'] = null;
            }
        }
        if (array_key_exists('da_mat', $data)) {
            $updateData['tinh_trang_song'] = $data['da_mat'] ? 0 : 1;
        }
        if (array_key_exists('ngay_mat', $data)) $updateData['ngay_mat_am'] = $data['ngay_mat'];
        if (array_key_exists('tieu_su', $data)) $updateData['tieu_su'] = $data['tieu_su'];
        if (array_key_exists('anh_dai_dien', $data)) $updateData['anh_dai_dien'] = $data['anh_dai_dien'];
        if (array_key_exists('thu_tu_sinh', $data)) $updateData['thu_tu_sinh'] = $data['thu_tu_sinh'];

        $tvOld = DB::table('thanh_viens')->where('id', $id)->first();
        $chaOld = DB::table('quan_hes')->where('node_2_id', $id)->where('loai_quan_he', 'cha_con')->value('node_1_id');
        $meOld = DB::table('quan_hes')->where('node_2_id', $id)->where('loai_quan_he', 'me_con')->value('node_1_id');
        $voChongOld = DB::table('quan_hes')
            ->where('loai_quan_he', 'vo_chong')
            ->where(function ($q) use ($id) {
                $q->where('node_1_id', $id)->orWhere('node_2_id', $id);
            })
            ->get()
            ->map(function ($qh) use ($id) {
                return $qh->node_1_id == $id ? (int) $qh->node_2_id : (int) $qh->node_1_id;
            })
            ->toArray();

        $duLieuCu = [
            'id' => $tvOld->id,
            'id_dong_ho' => $tvOld->dong_ho_id,
            'ten_day_du' => $tvOld->ho_ten,
            'gioi_tinh' => $tvOld->gioi_tinh,
            'ngay_sinh' => $tvOld->ngay_sinh_duong,
            'ngay_sinh_am' => $tvOld->ngay_sinh_am,
            'da_mat' => in_array($tvOld->tinh_trang_song, [0, '0', 'mat'], true),
            'ngay_mat' => $tvOld->ngay_mat_am,
            'tieu_su' => $tvOld->tieu_su,
            'anh_dai_dien' => $tvOld->anh_dai_dien,
            'doi_thu' => $tvOld->doi_thu,
            'id_cha' => $chaOld ? (int) $chaOld : null,
            'id_me' => $meOld ? (int) $meOld : null,
            'vo_chong_ids' => array_values(array_unique($voChongOld)),
        ];

        DB::transaction(function () use ($id, $updateData, $data, $duLieuCu) {
            if (!empty($updateData)) {
                DB::table('thanh_viens')->where('id', $id)->update($updateData);
            }


            if (array_key_exists('id_vo_chong_list', $data) || array_key_exists('id_vo_chong', $data)) {
                $voChongList = $data['id_vo_chong_list'] ?? [];
                if (isset($data['id_vo_chong']) && $data['id_vo_chong'] !== null) {
                    $voChongList[] = $data['id_vo_chong'];
                }
                $this->dongBoQuanHeVoChong($id, array_unique($voChongList));

                // Nếu là dâu/rể (không cha mẹ), đồng bộ đời theo phối ngẫu mới
                $coChaMe = DB::table('quan_hes')
                    ->where('node_2_id', $id)
                    ->whereIn('loai_quan_he', ['cha_con', 'me_con'])
                    ->exists();

                if (!$coChaMe && !empty($voChongList)) {
                    $spouseId = reset($voChongList);
                    $spouseDoi = DB::table('thanh_viens')->where('id', $spouseId)->value('doi_thu');
                    if ($spouseDoi !== null) {
                        $this->capNhatDoiThuDeQuy($id, $spouseDoi);
                    }
                }
            }

            if (array_key_exists('id_cha', $data) || array_key_exists('id_me', $data)) {
                $chaCon = DB::table('quan_hes')->where('node_2_id', $id)->where('loai_quan_he', 'cha_con')->first();
                $meCon = DB::table('quan_hes')->where('node_2_id', $id)->where('loai_quan_he', 'me_con')->first();
                $idChaHienTai = $chaCon ? $chaCon->node_1_id : null;
                $idMeHienTai = $meCon ? $meCon->node_1_id : null;

                $idChaMoi = array_key_exists('id_cha', $data) ? $data['id_cha'] : $idChaHienTai;
                $idMeMoi = array_key_exists('id_me', $data) ? $data['id_me'] : $idMeHienTai;
                $this->dongBoQuanHeChaMe($id, $idChaMoi, $idMeMoi);

                // Đồng bộ đệ quy đời thứ khi thay cha mẹ
                $doiThuMoi = 1;
                if ($idChaMoi) {
                    $parentDoi = DB::table('thanh_viens')->where('id', $idChaMoi)->value('doi_thu');
                    if ($parentDoi !== null) {
                        $doiThuMoi = $parentDoi + 1;
                    }
                } elseif ($idMeMoi) {
                    $parentDoi = DB::table('thanh_viens')->where('id', $idMeMoi)->value('doi_thu');
                    if ($parentDoi !== null) {
                        $doiThuMoi = $parentDoi + 1;
                    }
                }
                $this->capNhatDoiThuDeQuy($id, $doiThuMoi);
            }

            // Ghi nhận nhật ký gia phả khi cập nhật thành công
            $tvNew = DB::table('thanh_viens')->where('id', $id)->first();
            $chaNew = DB::table('quan_hes')->where('node_2_id', $id)->where('loai_quan_he', 'cha_con')->value('node_1_id');
            $meNew = DB::table('quan_hes')->where('node_2_id', $id)->where('loai_quan_he', 'me_con')->value('node_1_id');
            $voChongNew = DB::table('quan_hes')
                ->where('loai_quan_he', 'vo_chong')
                ->where(function ($q) use ($id) {
                    $q->where('node_1_id', $id)->orWhere('node_2_id', $id);
                })
                ->get()
                ->map(function ($qh) use ($id) {
                    return $qh->node_1_id == $id ? (int) $qh->node_2_id : (int) $qh->node_1_id;
                })
                ->toArray();

            $duLieuMoi = [
                'id' => $tvNew->id,
                'id_dong_ho' => $tvNew->dong_ho_id,
                'ten_day_du' => $tvNew->ho_ten,
                'gioi_tinh' => $tvNew->gioi_tinh,
                'ngay_sinh' => $tvNew->ngay_sinh_duong,
                'ngay_sinh_am' => $tvNew->ngay_sinh_am,
                'da_mat' => in_array($tvNew->tinh_trang_song, [0, '0', 'mat'], true),
                'ngay_mat' => $tvNew->ngay_mat_am,
                'tieu_su' => $tvNew->tieu_su,
                'anh_dai_dien' => $tvNew->anh_dai_dien,
                'doi_thu' => $tvNew->doi_thu,
                'id_cha' => $chaNew ? (int) $chaNew : null,
                'id_me' => $meNew ? (int) $meNew : null,
                'vo_chong_ids' => array_values(array_unique($voChongNew)),
            ];

            // Build change description
            $changes = [];
            if ($duLieuCu['ten_day_du'] !== $duLieuMoi['ten_day_du']) {
                $changes[] = 'tên ("' . $duLieuCu['ten_day_du'] . '" -> "' . $duLieuMoi['ten_day_du'] . '")';
            }
            if ($duLieuCu['gioi_tinh'] !== $duLieuMoi['gioi_tinh']) {
                $changes[] = 'giới tính';
            }
            if ($duLieuCu['ngay_sinh'] !== $duLieuMoi['ngay_sinh']) {
                $changes[] = 'ngày sinh';
            }
            if ($duLieuCu['da_mat'] !== $duLieuMoi['da_mat']) {
                $changes[] = 'trạng thái sống/mất';
            }
            if ($duLieuCu['id_cha'] !== $duLieuMoi['id_cha']) {
                $changes[] = 'cha';
            }
            if ($duLieuCu['id_me'] !== $duLieuMoi['id_me']) {
                $changes[] = 'mẹ';
            }
            if (array_diff($duLieuCu['vo_chong_ids'], $duLieuMoi['vo_chong_ids']) || array_diff($duLieuMoi['vo_chong_ids'], $duLieuCu['vo_chong_ids'])) {
                $changes[] = 'vợ/chồng';
            }

            $moTa = 'Cập nhật thành viên "' . $duLieuCu['ten_day_du'] . '"' . 
                (!empty($changes) ? ' (Thay đổi: ' . implode(', ', $changes) . ')' : '');

            \App\Models\NhatKyGiaPha::create([
                'dong_ho_id' => $tvNew->dong_ho_id,
                'thanh_vien_id' => $id,
                'nguoi_thuc_hien_id' => auth()->id(),
                'hanh_dong' => 'update',
                'du_lieu_cu' => $duLieuCu,
                'du_lieu_moi' => $duLieuMoi,
                'mo_ta' => $moTa,
                'created_at' => now(),
            ]);
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

        $id = $data['id'];
        $tvOld = DB::table('thanh_viens')->where('id', $id)->first();
        $chaOld = DB::table('quan_hes')->where('node_2_id', $id)->where('loai_quan_he', 'cha_con')->value('node_1_id');
        $meOld = DB::table('quan_hes')->where('node_2_id', $id)->where('loai_quan_he', 'me_con')->value('node_1_id');
        $voChongOld = DB::table('quan_hes')
            ->where('loai_quan_he', 'vo_chong')
            ->where(function ($q) use ($id) {
                $q->where('node_1_id', $id)->orWhere('node_2_id', $id);
            })
            ->get()
            ->map(function ($qh) use ($id) {
                return $qh->node_1_id == $id ? (int) $qh->node_2_id : (int) $qh->node_1_id;
            })
            ->toArray();

        $duLieuCu = [
            'id' => $tvOld->id,
            'id_dong_ho' => $tvOld->dong_ho_id,
            'ten_day_du' => $tvOld->ho_ten,
            'gioi_tinh' => $tvOld->gioi_tinh,
            'ngay_sinh' => $tvOld->ngay_sinh_duong,
            'ngay_sinh_am' => $tvOld->ngay_sinh_am,
            'da_mat' => in_array($tvOld->tinh_trang_song, [0, '0', 'mat'], true),
            'ngay_mat' => $tvOld->ngay_mat_am,
            'tieu_su' => $tvOld->tieu_su,
            'anh_dai_dien' => $tvOld->anh_dai_dien,
            'doi_thu' => $tvOld->doi_thu,
            'id_cha' => $chaOld ? (int) $chaOld : null,
            'id_me' => $meOld ? (int) $meOld : null,
            'vo_chong_ids' => array_values(array_unique($voChongOld)),
        ];

        DB::transaction(function () use ($data, $duLieuCu) {
            // 1. Xử lý tài khoản người dùng liên kết
            $linkedUser = \App\Models\NguoiDung::where('thanh_vien_id', $data['id'])->first();
            if ($linkedUser) {
                // Thu hồi tất cả tokens hiện có để buộc đăng xuất
                try {
                    $linkedUser->tokens()->delete();
                } catch (\Exception $e) {}

                // Cập nhật trạng thái khóa tài khoản và gỡ liên kết
                $linkedUser->update([
                    'trang_thai'          => 0,
                    'thanh_vien_id'       => null,
                    'dong_ho_id'          => null,
                    'trang_thai_gia_nhap' => 'tu_choi',
                ]);
            }

            // 2. Dọn dẹp mối quan hệ (quan_hes)
            DB::table('quan_hes')
                ->where('node_1_id', $data['id'])
                ->orWhere('node_2_id', $data['id'])
                ->delete();

            // 3. Dọn dẹp mộ phần (mo_phans)
            DB::table('mo_phans')->where('thanh_vien_id', $data['id'])->delete();

            // Ghi nhận nhật ký gia phả khi xóa (Ghi trước khi xóa để tránh lỗi khóa ngoại)
            \App\Models\NhatKyGiaPha::create([
                'dong_ho_id' => $duLieuCu['id_dong_ho'],
                'thanh_vien_id' => $data['id'],
                'nguoi_thuc_hien_id' => auth()->id(),
                'hanh_dong' => 'delete',
                'du_lieu_cu' => $duLieuCu,
                'du_lieu_moi' => null,
                'mo_ta' => 'Xóa thành viên "' . $duLieuCu['ten_day_du'] . '"',
                'created_at' => now(),
            ]);

            // 4. Xóa thành viên
            DB::table('thanh_viens')->where('id', $data['id'])->delete();
        });


        return response()->json([
            'success' => true,
            'message' => 'Xóa thành viên thành công.',
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
                ?? 'Không rõ';
        }

        $dist1 = $distance['dA'];
        $dist2 = $distance['dB'];

        if ($dist1 === 0) {
            if ($dist2 === 1) {
                return 'Con';
            } elseif ($dist2 === 2) {
                return 'Cháu';
            } elseif ($dist2 === 3) {
                return 'Chắt';
            } elseif ($dist2 === 4) {
                return 'Chút';
            } elseif ($dist2 === 5) {
                return 'Chít';
            }

            return 'Hậu duệ đời thứ ' . $dist2;
        }

        if ($dist2 === 0) {
            if ($dist1 === 1) {
                return $nguoiKhac['gioi_tinh'] === 'nam' ? 'Cha' : 'Mẹ';
            } elseif ($dist1 === 2) {
                return $nguoiKhac['gioi_tinh'] === 'nam' ? 'Ông' : 'Bà';
            } elseif ($dist1 === 3) {
                return 'Cụ';
            } elseif ($dist1 === 4) {
                return 'Kỵ';
            }

            return 'Tổ tiên đời thứ ' . $dist1;
        }

        if ($dist1 === $dist2) {
            return 'Anh/Chị/Em họ';
        }

        if ($dist1 > $dist2) {
            $diff = $dist1 - $dist2;

            return $diff === 1
                ? ($nguoiKhac['gioi_tinh'] === 'nam' ? 'Chú/Bác/Cậu' : 'Cô/Dì/Bác')
                : 'Ông/Bà họ';
        }

        $diff = $dist2 - $dist1;

        return $diff === 1 ? 'Cháu họ' : 'Chắt/Chút họ';
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
            return $person['gioi_tinh'] === 'nam' ? 'Cha' : 'Mẹ';
        } elseif ($distance === 2) {
            return $person['gioi_tinh'] === 'nam' ? 'Ông' : 'Bà';
        } elseif ($distance === 3) {
            return 'Cụ';
        } elseif ($distance === 4) {
            return 'Kỵ';
        }

        return 'Tổ tiên đời thứ ' . $distance;
    }

    private function descendantLabel(int $distance): string
    {
        if ($distance === 1) {
            return 'Con';
        } elseif ($distance === 2) {
            return 'Cháu';
        } elseif ($distance === 3) {
            return 'Chắt';
        } elseif ($distance === 4) {
            return 'Chút';
        } elseif ($distance === 5) {
            return 'Chít';
        }

        return 'Hậu duệ đời thứ ' . $distance;
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
            $ngaySinhAmFormatted = null;
            if ($tv->ngay_sinh_am) {
                try {
                    $carbonAm = \Carbon\Carbon::parse($tv->ngay_sinh_am);
                    $ngaySinhAmFormatted = \App\Support\LunarSolarConverter::formatLunarDate($carbonAm->day, $carbonAm->month, $carbonAm->year);
                } catch (\Exception $e) {}
            }

            $ngayMatAmFormatted = null;
            if ($tv->ngay_mat_am) {
                try {
                    $carbonMat = \Carbon\Carbon::parse($tv->ngay_mat_am);
                    $ngayMatAmFormatted = \App\Support\LunarSolarConverter::formatLunarDate($carbonMat->day, $carbonMat->month, $carbonMat->year);
                } catch (\Exception $e) {}
            }

            return [
                'id' => $tv->id,
                'id_dong_ho' => $tv->dong_ho_id,
                'ten_day_du' => $tv->ho_ten,
                'gioi_tinh' => $tv->gioi_tinh,
                'ngay_sinh' => $tv->ngay_sinh_duong,
                'ngay_sinh_am' => $tv->ngay_sinh_am,
                'ngay_sinh_am_formatted' => $ngaySinhAmFormatted,
                'ngay_mat' => $tv->ngay_mat_am,
                'ngay_mat_formatted' => $ngayMatAmFormatted,
                'da_mat' => in_array($tv->tinh_trang_song, [0, '0', 'mat'], true),
                'id_cha' => $mapCha[$tv->id] ?? null,
                'id_me' => $mapMe[$tv->id] ?? null,
                'vo_chong_ids' => array_values(array_unique($mapVoChong[$tv->id] ?? [])),
                'tieu_su' => $tv->tieu_su,
                'anh_dai_dien' => $tv->anh_dai_dien,
                'doi_thu' => $tv->doi_thu,
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
                ->where(function ($query) use ($idNguoi, $idsRemove) {
                    $query->where(function ($q) use ($idNguoi, $idsRemove) {
                        $q->where('node_1_id', $idNguoi)->whereIn('node_2_id', $idsRemove);
                    })->orWhere(function ($q) use ($idNguoi, $idsRemove) {
                        $q->where('node_2_id', $idNguoi)->whereIn('node_1_id', $idsRemove);
                    });
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

    private function capNhatDoiThuDeQuy(int $id, int $doiThuMoi): void
    {
        DB::table('thanh_viens')->where('id', $id)->update(['doi_thu' => $doiThuMoi]);

        // Cập nhật tất cả các con đẻ
        $conIds = DB::table('quan_hes')
            ->where('node_1_id', $id)
            ->whereIn('loai_quan_he', ['cha_con', 'me_con'])
            ->pluck('node_2_id')
            ->toArray();

        foreach ($conIds as $conId) {
            $this->capNhatDoiThuDeQuy($conId, $doiThuMoi + 1);
        }

        // Cập nhật tất cả vợ/chồng (đồng đời)
        $voChongQuanHes = DB::table('quan_hes')
            ->where('loai_quan_he', 'vo_chong')
            ->where(function ($query) use ($id) {
                $query->where('node_1_id', $id)
                    ->orWhere('node_2_id', $id);
            })
            ->get();

        $voChongIds = [];
        foreach ($voChongQuanHes as $qh) {
            $voChongIds[] = $qh->node_1_id == $id ? $qh->node_2_id : $qh->node_1_id;
        }
        $voChongIds = array_unique($voChongIds);

        foreach ($voChongIds as $vcId) {
            $currentVc = DB::table('thanh_viens')->where('id', $vcId)->first();
            if ($currentVc && $currentVc->doi_thu !== $doiThuMoi) {
                DB::table('thanh_viens')->where('id', $vcId)->update(['doi_thu' => $doiThuMoi]);
                
                $conVcIds = DB::table('quan_hes')
                    ->where('node_1_id', $vcId)
                    ->whereIn('loai_quan_he', ['cha_con', 'me_con'])
                    ->pluck('node_2_id')
                    ->toArray();

                foreach ($conVcIds as $conId) {
                    $this->capNhatDoiThuDeQuy($conId, $doiThuMoi + 1);
                }
            }
        }
    }
}
