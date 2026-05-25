<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Notification\MarkReadNotificationRequest;
use App\Models\ThongBao;
use Illuminate\Http\Request;

class ThongBaoController extends Controller
{
    /**
     * Lấy danh sách thông báo của người dùng hiện tại
     */
    public function index(Request $request)
    {
        $limit = $request->query('limit', 20);
        
        $notifications = ThongBao::forUser($request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate($limit);

        // Định dạng dữ liệu tương thích hoàn toàn với kiểu Notif của giao diện
        $formattedData = collect($notifications->items())->map(function ($notif) {
            return [
                'id'         => (string) $notif->id,
                'type'       => $notif->loai,
                'title'      => $notif->tieu_de,
                'body'       => $notif->noi_dung,
                'time'       => $notif->created_at->toISOString(),
                'read'       => (bool) $notif->da_doc,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $formattedData,
            'meta'    => [
                'current_page' => $notifications->currentPage(),
                'last_page'    => $notifications->lastPage(),
                'total'        => $notifications->total(),
            ]
        ]);
    }

    /**
     * Đánh dấu một thông báo là đã đọc
     */
    public function read(MarkReadNotificationRequest $request)
    {
        // Tuân thủ nghiêm ngặt Rule 6: Chỉ đọc từ validated()
        $data = $request->validated();

        ThongBao::where('id', $data['id'])->update([
            'da_doc' => true
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã đánh dấu thông báo là đã đọc.'
        ]);
    }

    /**
     * Đánh dấu tất cả thông báo là đã đọc
     */
    public function readAll(Request $request)
    {
        ThongBao::forUser($request->user()->id)
            ->where('da_doc', false)
            ->update([
                'da_doc' => true
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã đánh dấu tất cả thông báo là đã đọc.'
        ]);
    }
}
