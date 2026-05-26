<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NguoiDung;
use Illuminate\Http\Request;
use App\Http\Requests\DuyetThanhVien\ProcessRequest;
use App\Support\MaThanhVienHelper;

class DuyetThanhVienController extends Controller
{
    /**
     * Lấy danh sách tài khoản chờ duyệt của dòng họ
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->quyen_han !== 'quan_ly') {
            return response()->json(['success' => false, 'message' => 'Không có quyền truy cập.'], 403);
        }

        $pendingUsers = NguoiDung::where('dong_ho_id', $user->dong_ho_id)
            ->where('trang_thai_gia_nhap', 'cho_duyet')
            ->select('id', 'ho_ten', 'email', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $pendingUsers
        ]);
    }

    /**
     * Xử lý duyệt hoặc từ chối
     */
    public function process(ProcessRequest $request)
    {
        $data = $request->validated();
        $manager = $request->user();

        $targetUser = NguoiDung::where('id', $data['user_id'])
            ->where('dong_ho_id', $manager->dong_ho_id)
            ->where('trang_thai_gia_nhap', 'cho_duyet')
            ->first();

        if (!$targetUser) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy yêu cầu gia nhập hợp lệ.'
            ], 404);
        }

        if ($data['action'] === 'approve') {
            \Illuminate\Support\Facades\DB::beginTransaction();
            try {
                // Lấy thông tin thành viên liên quan nếu có
                $tvLienQuan = null;
                if (!empty($data['thanh_vien_lien_quan_id'])) {
                    $tvLienQuan = \App\Models\ThanhVien::find($data['thanh_vien_lien_quan_id']);
                }

                $doiThu = $data['doi_thu'] ?? null;
                
                // Tự động suy luận đời thứ nếu chưa truyền vào nhưng có liên kết quan hệ
                if (!$doiThu && $tvLienQuan && !empty($data['loai_quan_he'])) {
                    if (in_array($data['loai_quan_he'], ['vo_chong', 'anh_chi_em'])) {
                        $doiThu = $tvLienQuan->doi_thu;
                    } elseif (in_array($data['loai_quan_he'], ['cha_con', 'me_con'])) {
                        $doiThu = $tvLienQuan->doi_thu ? $tvLienQuan->doi_thu + 1 : null;
                    }
                }

                $thanhVienData = [
                    'dong_ho_id' => $targetUser->dong_ho_id,
                    'ma_thanh_vien' => MaThanhVienHelper::generate($targetUser->dong_ho_id),
                    'ho_ten' => $targetUser->ho_ten,
                    'gioi_tinh' => 'nam', // Mặc định là nam, trưởng tộc có thể sửa sau
                    'tinh_trang_song' => 1, // Còn sống
                ];
                if ($doiThu) $thanhVienData['doi_thu'] = $doiThu;
                if (isset($data['thu_tu_sinh'])) $thanhVienData['thu_tu_sinh'] = $data['thu_tu_sinh'];

                // 1. Tạo thành viên mới trên Cây gia phả
                $thanhVien = \App\Models\ThanhVien::create($thanhVienData);

                // Nếu có yêu cầu nối quan hệ
                if ($tvLienQuan && !empty($data['loai_quan_he'])) {
                    $loaiQuanHe = $data['loai_quan_he'];
                    if (in_array($loaiQuanHe, ['vo_chong', 'cha_con', 'me_con'])) {
                        \App\Models\QuanHe::create([
                            'node_1_id' => $tvLienQuan->id,
                            'node_2_id' => $thanhVien->id,
                            'loai_quan_he' => $loaiQuanHe
                        ]);
                    } elseif ($loaiQuanHe === 'anh_chi_em') {
                        // Nếu là anh chị em, tìm cha/mẹ của người liên quan và gắn người mới làm con của họ
                        $parentRelation = \App\Models\QuanHe::where('node_2_id', $tvLienQuan->id)
                            ->whereIn('loai_quan_he', ['cha_con', 'me_con'])
                            ->first();

                        if ($parentRelation) {
                            \App\Models\QuanHe::create([
                                'node_1_id' => $parentRelation->node_1_id,
                                'node_2_id' => $thanhVien->id,
                                'loai_quan_he' => $parentRelation->loai_quan_he
                            ]);
                        }
                    }
                }

                // 2. Duyệt tài khoản và gán vào thành viên vừa tạo
                $targetUser->trang_thai_gia_nhap = 'da_duyet';
                $targetUser->thanh_vien_id = $thanhVien->id;
                $targetUser->save();

                \Illuminate\Support\Facades\DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Đã duyệt thành viên thành công.'
                ]);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Có lỗi xảy ra khi tạo thành viên.'
                ], 500);
            }
        } else {
            // Reject: Hủy bỏ đăng ký dòng họ
            $targetUser->dong_ho_id = null;
            $targetUser->trang_thai_gia_nhap = null;
            $targetUser->quyen_han = 'thanh_vien'; // Reset quyền
            $targetUser->save();
            return response()->json([
                'success' => true,
                'message' => 'Đã từ chối yêu cầu gia nhập.'
            ]);
        }
    }
}
