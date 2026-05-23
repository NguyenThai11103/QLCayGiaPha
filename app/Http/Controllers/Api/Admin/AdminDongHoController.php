<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\DongHo;
use Illuminate\Http\Request;
use App\Http\Requests\Admin\UpdateStatusRequest;

class AdminDongHoController extends Controller
{
    public function index(Request $request)
    {
        // Lấy danh sách dòng họ, kèm thông tin đếm số người dùng trực thuộc (thanh_vien và quan_ly)
        $query = DongHo::withCount('nguoiDungs');

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where('ten_dong_ho', 'like', "%{$search}%");
        }

        if ($request->filled('trang_thai')) {
            $query->where('trang_thai', $request->get('trang_thai'));
        }

        $dongHos = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $dongHos
        ]);
    }

    public function updateStatus(UpdateStatusRequest $request, $id)
    {
        $dongHo = DongHo::find($id);

        if (!$dongHo) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy dòng họ này.'
            ], 404);
        }

        $data = $request->validated();
        $dongHo->trang_thai = $data['trang_thai'];
        $dongHo->save();

        return response()->json([
            'success' => true,
            'message' => 'Đã cập nhật trạng thái dòng họ thành công.',
            'data' => $dongHo
        ]);
    }

    public function destroy($id)
    {
        $dongHo = DongHo::find($id);

        if (!$dongHo) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy dòng họ này.'
            ], 404);
        }

        $dongHo->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa dòng họ khỏi hệ thống.'
        ]);
    }
}
