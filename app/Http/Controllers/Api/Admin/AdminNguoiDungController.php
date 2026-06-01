<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\NguoiDung;
use Illuminate\Http\Request;
use App\Http\Requests\Admin\UpdateStatusRequest;

class AdminNguoiDungController extends Controller
{
    public function index(Request $request)
    {
        // Lấy danh sách người dùng kèm theo thông tin dòng họ của họ
        $query = NguoiDung::with('dongHo:id,ten_dong_ho');

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('ho_ten', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('trang_thai')) {
            $query->where('trang_thai', $request->get('trang_thai'));
        }
        
        if ($request->filled('quyen_han')) {
            $query->where('quyen_han', $request->get('quyen_han'));
        }

        if ($request->filled('dong_ho_id')) {
            $query->where('dong_ho_id', $request->get('dong_ho_id'));
        }

        $nguoiDungs = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $nguoiDungs
        ]);
    }

    public function updateStatus(UpdateStatusRequest $request, $id)
    {
        $nguoiDung = NguoiDung::find($id);

        if (!$nguoiDung) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy người dùng này.'
            ], 404);
        }

        $data = $request->validated();
        $nguoiDung->trang_thai = $data['trang_thai'];
        $nguoiDung->save();

        return response()->json([
            'success' => true,
            'message' => 'Đã cập nhật trạng thái người dùng thành công.',
            'data' => $nguoiDung
        ]);
    }

    public function destroy($id)
    {
        $nguoiDung = NguoiDung::find($id);

        if (!$nguoiDung) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy người dùng này.'
            ], 404);
        }

        // Thu hồi toàn bộ tokens hoạt động để buộc đăng xuất
        try {
            $nguoiDung->tokens()->delete();
        } catch (\Exception $e) {}

        // Thực hiện khóa tài khoản và gỡ toàn bộ liên kết
        $nguoiDung->update([
            'trang_thai'          => 0,
            'thanh_vien_id'       => null,
            'dong_ho_id'          => null,
            'trang_thai_gia_nhap' => 'tu_choi',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã khóa tài khoản và xóa người dùng khỏi hệ thống.'
        ]);
    }
}
