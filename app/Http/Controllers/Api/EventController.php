<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SuKien;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->dong_ho_id) {
            return response()->json([
                'success' => false,
                'message' => 'Người dùng chưa thuộc dòng họ nào.'
            ], 403);
        }

        $su_kiens = SuKien::where('dong_ho_id', $user->dong_ho_id)->get();

        $typeMap = [
            'le_gio'      => 'anniversary',
            'le_mung_tho' => 'longevity',
            'hop_dong_ho' => 'ceremony',
            'khuyen_hoc'  => 'ceremony',
            'khac'        => 'ceremony',
        ];

        $events = $su_kiens->map(function ($sk) use ($typeMap) {
            return [
                'id'          => 'e' . $sk->id,
                'date'        => $sk->ngay_duong ? $sk->ngay_duong->format('Y-m-d') : now()->format('Y-m-d'),
                'lunarDate'   => $sk->ngay_am ? $sk->ngay_am->format('d/m') . ' ÂL' : null,
                'title'       => $sk->ten_su_kien,
                'type'        => $typeMap[$sk->loai_su_kien] ?? 'ceremony',
                'location'    => $sk->dia_diem ?? 'Chưa cập nhật',
                'attendees'   => rand(20, 100),
                'rsvpStatus'  => 'pending',
                'description' => $sk->mo_ta,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $events
        ]);
    }
}
