<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Onboarding\JoinClanRequest;
use App\Models\DongHo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OnboardingController extends Controller
{
    /**
     * Tìm kiếm dòng họ dựa vào từ khóa (Tên dòng họ)
     */
    public function searchClan(Request $request)
    {
        $keyword = $request->query('keyword');

        if (!$keyword) {
            return response()->json([
                'success' => true,
                'data' => []
            ]);
        }

        $clans = DongHo::where('ten_dong_ho', 'like', '%' . $keyword . '%')
            ->where('trang_thai', true)
            ->select('id', 'ten_dong_ho', 'dia_chi_tu_duong', 'mo_ta')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $clans
        ]);
    }

    /**
     * Gửi yêu cầu gia nhập một dòng họ đã tồn tại
     */
    public function joinClan(JoinClanRequest $request)
    {
        $data = $request->validated();
        $user = $request->user();

        if ($user->dong_ho_id) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn đã thuộc về một dòng họ rồi.'
            ], 400);
        }

        DB::beginTransaction();
        try {
            // Cập nhật thông tin user: Gắn vào dòng họ với quyền thành viên và trạng thái chờ duyệt
            $user->dong_ho_id = $data['dong_ho_id'];
            $user->quyen_han = 'thanh_vien';
            $user->trang_thai_gia_nhap = 'cho_duyet';
            $user->ho_ten = $data['ho_ten_thanh_vien']; // Cập nhật tên theo người dùng tự điền
            
            // Xử lý tạo thông tin thành viên dự thảo (tùy chọn)
            // Trong luồng này, ta có thể chỉ cần chờ Quản lý tạo thành viên sau khi duyệt, 
            // hoặc tạo sẵn 1 record ThanhVien mồ côi
            
            $user->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Đã gửi yêu cầu gia nhập dòng họ. Vui lòng chờ Quản lý duyệt.'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Người dùng không được tự tạo dòng họ. Dòng họ mới do admin hệ thống tạo.
     */
    public function createClan(Request $request)
    {
        return response()->json([
            'success' => false,
            'message' => 'Chỉ quản trị viên hệ thống mới được tạo dòng họ mới.'
        ], 403);
    }
}
