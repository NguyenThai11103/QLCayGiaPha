<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NhatKyGiaPha;
use App\Support\AccessControl;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class NhatKyGiaPhaController extends Controller
{
    public function index(Request $request)
    {
        $idDongHo = $request->query('dong_ho_id');
        if (!$idDongHo) {
            return response()->json(['success' => false, 'message' => 'Missing dong_ho_id'], 422);
        }

        if (!AccessControl::canAccessFamily($request->user(), $idDongHo)) {
            return AccessControl::forbidden();
        }

        $logs = NhatKyGiaPha::where('dong_ho_id', $idDongHo)
            ->with(['nguoiThucHien'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }

    public function restore(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:nhat_ky_gia_phas,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $log = NhatKyGiaPha::find($request->input('id'));

        if (!AccessControl::canManageFamily($request->user(), $log->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        $duLieuCu = $log->du_lieu_cu;
        if (!$duLieuCu) {
            return response()->json(['success' => false, 'message' => 'Không có dữ liệu lịch sử để khôi phục'], 400);
        }

        $thanhVienId = $log->thanh_vien_id ?? $duLieuCu['id'];

        DB::transaction(function () use ($log, $duLieuCu, $thanhVienId) {
            // Core fields for thanh_viens
            $coreData = [
                'dong_ho_id' => $duLieuCu['id_dong_ho'],
                'ho_ten' => $duLieuCu['ten_day_du'],
                'gioi_tinh' => $duLieuCu['gioi_tinh'],
                'ngay_sinh_duong' => $duLieuCu['ngay_sinh'] ?? null,
                'ngay_sinh_am' => $duLieuCu['ngay_sinh_am'] ?? null,
                'tinh_trang_song' => $duLieuCu['da_mat'] ? 0 : 1,
                'ngay_mat_am' => $duLieuCu['ngay_mat'] ?? null,
                'tieu_su' => $duLieuCu['tieu_su'] ?? null,
                'anh_dai_dien' => $duLieuCu['anh_dai_dien'] ?? null,
                'doi_thu' => $duLieuCu['doi_thu'] ?? 1,
                'updated_at' => now(),
            ];

            // Check if member still exists in DB
            $exists = DB::table('thanh_viens')->where('id', $thanhVienId)->exists();

            if ($exists) {
                DB::table('thanh_viens')->where('id', $thanhVienId)->update($coreData);
            } else {
                // Re-insert with its original ID!
                $coreData['id'] = $thanhVienId;
                $coreData['created_at'] = now();
                DB::table('thanh_viens')->insert($coreData);
            }

            // Restore relationships
            $idCha = $duLieuCu['id_cha'] ?? null;
            $idMe = $duLieuCu['id_me'] ?? null;
            $voChongIds = $duLieuCu['vo_chong_ids'] ?? [];

            $this->dongBoQuanHeChaMe($thanhVienId, $idCha, $idMe);
            $this->dongBoQuanHeVoChong($thanhVienId, $voChongIds);

            // Recalculate generation level recursively
            $this->capNhatDoiThuDeQuy($thanhVienId, $coreData['doi_thu']);

            // Ghi nhận nhật ký hành động khôi phục
            NhatKyGiaPha::create([
                'dong_ho_id' => $log->dong_ho_id,
                'thanh_vien_id' => $thanhVienId,
                'nguoi_thuc_hien_id' => auth()->id(),
                'hanh_dong' => 'restore',
                'du_lieu_cu' => null,
                'du_lieu_moi' => $duLieuCu,
                'mo_ta' => 'Khôi phục thành viên "' . $coreData['ho_ten'] . '" về trạng thái ngày ' . $log->created_at,
                'created_at' => now(),
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Khôi phục thông tin thành viên thành công.',
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

    private function dongBoQuanHeVoChong(int $idNguoi, array $idVoChongList): void
    {
        DB::table('quan_hes')
            ->where('loai_quan_he', 'vo_chong')
            ->where(function ($query) use ($idNguoi) {
                $query->where('node_1_id', $idNguoi)
                    ->orWhere('node_2_id', $idNguoi);
            })
            ->delete();

        $insertBatches = [];
        foreach ($idVoChongList as $idVoChongMoi) {
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

    private function capNhatDoiThuDeQuy(int $id, int $doiThuMoi): void
    {
        DB::table('thanh_viens')->where('id', $id)->update(['doi_thu' => $doiThuMoi]);

        // Cập nhật tất cả các con
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
