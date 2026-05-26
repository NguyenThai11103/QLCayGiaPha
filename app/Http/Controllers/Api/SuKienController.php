<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuKien\CreateSuKienRequest;
use App\Http\Requests\SuKien\UpdateSuKienRequest;
use App\Http\Requests\SuKien\DeleteSuKienRequest;
use App\Http\Requests\SuKien\AttendSuKienRequest;
use App\Http\Requests\SuKien\LeaveSuKienRequest;
use App\Models\SuKien;
use App\Support\AccessControl;
use App\Support\LunarSolarConverter;
use Illuminate\Http\Request;
use Carbon\Carbon;

class SuKienController extends Controller
{
    public function index(Request $request)
    {
        $idDongHo = $request->query('dong_ho_id');
        $query = SuKien::with(['thanhVien'])->withCount('participants');

        if ($idDongHo && !AccessControl::canAccessFamily($request->user(), $idDongHo)) {
            return AccessControl::forbidden();
        }

        AccessControl::scopeFamilyQuery($query, $request->user());

        if ($idDongHo) {
            $query->where('dong_ho_id', $idDongHo);
        }

        $events = $query->get();
        $userId = $request->user()->id;
        
        $currentYear = Carbon::now()->year;
        $nextYear = $currentYear + 1;
        $today = Carbon::today();

        $data = $events->map(function ($event) use ($userId, $currentYear, $nextYear, $today) {
            $arr = $event->toArray();
            $arr['is_attending'] = $event->participants()->where('nguoi_dungs.id', $userId)->exists();
            
            // Calculate next_date for frontend
            $nextDate = null;
            if ($event->lap_lai_hang_nam) {
                if ($event->ngay_am) {
                    $am = Carbon::parse($event->ngay_am);
                    $solarThisYear = LunarSolarConverter::lunarToSolar($am->day, $am->month, $currentYear);
                    if (Carbon::parse($solarThisYear)->lt($today)) {
                        $nextDate = LunarSolarConverter::lunarToSolar($am->day, $am->month, $nextYear);
                    } else {
                        $nextDate = $solarThisYear;
                    }
                } elseif ($event->ngay_duong) {
                    $duong = Carbon::parse($event->ngay_duong);
                    $solarThisYear = Carbon::createFromDate($currentYear, $duong->month, $duong->day)->format('Y-m-d');
                    if (Carbon::parse($solarThisYear)->lt($today)) {
                        $nextDate = Carbon::createFromDate($nextYear, $duong->month, $duong->day)->format('Y-m-d');
                    } else {
                        $nextDate = $solarThisYear;
                    }
                }
            } else {
                if ($event->ngay_duong) {
                    $nextDate = Carbon::parse($event->ngay_duong)->format('Y-m-d');
                } elseif ($event->ngay_am) {
                    // Âm lịch không lặp lại thì dùng LunarConverter tính ra ngày dương của năm tạo ra sự kiện
                    $am = Carbon::parse($event->ngay_am);
                    $nextDate = LunarSolarConverter::lunarToSolar($am->day, $am->month, $am->year);
                }
            }
            
            $arr['next_date'] = $nextDate;
            return $arr;
        });

        return response()->json([
            'success'   => true,
            'data'      => $data
        ]);
    }

    public function store(CreateSuKienRequest $request)
    {
        $data = $request->validated();

        if (!AccessControl::canManageFamily($request->user(), $data['dong_ho_id'])) {
            return AccessControl::forbidden();
        }
        
        $data['lap_lai_hang_nam'] = $data['lap_lai_hang_nam'] ?? false;

        $suKien = SuKien::create($data);

        return response()->json([
            'success'   => true,
            'message'   => 'Tạo sự kiện thành công',
            'id'        => $suKien->id
        ]);
    }

    public function update(UpdateSuKienRequest $request)
    {
        $data = $request->validated();
        $id = $data['id'];
        unset($data['id']);
        
        $suKien = SuKien::find($id);

        if (!$suKien) {
            return response()->json(['success' => false, 'message' => 'Khong tim thay'], 404);
        }

        if (!AccessControl::canManageFamily($request->user(), $suKien->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        if (array_key_exists('dong_ho_id', $data) && !AccessControl::canManageFamily($request->user(), $data['dong_ho_id'])) {
            return AccessControl::forbidden();
        }

        $suKien->update($data);

        return response()->json([
            'success'   => true,
            'message'   => 'Cập nhật sự kiện thành công'
        ]);
    }

    public function destroy(DeleteSuKienRequest $request)
    {
        $data = $request->validated();
        $suKien = SuKien::find($data['id']);

        if (!$suKien) {
            return response()->json(['success' => false, 'message' => 'Khong tim thay'], 404);
        }

        if (!AccessControl::canManageFamily($request->user(), $suKien->dong_ho_id)) {
            return AccessControl::forbidden();
        }
        
        $suKien->delete();

        return response()->json([
            'success'   => true,
            'message'   => 'Xóa sự kiện thành công'
        ]);
    }

    public function attend(AttendSuKienRequest $request)
    {
        $data = $request->validated();
        $suKien = SuKien::find($data['id']);

        if (!$suKien) {
            return response()->json(['success' => false, 'message' => 'Khong tim thay'], 404);
        }

        if (!AccessControl::canAccessFamily($request->user(), $suKien->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        $suKien->participants()->syncWithoutDetaching([
            $request->user()->id => [
                'so_nguoi_di_cung' => $data['so_nguoi_di_cung'] ?? 0,
                'ghi_chu' => $data['ghi_chu'] ?? null,
            ]
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã đăng ký tham dự thành công'
        ]);
    }

    public function leave(LeaveSuKienRequest $request)
    {
        $data = $request->validated();
        $suKien = SuKien::find($data['id']);

        if (!$suKien) {
            return response()->json(['success' => false, 'message' => 'Khong tim thay'], 404);
        }

        if (!AccessControl::canAccessFamily($request->user(), $suKien->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        $suKien->participants()->detach($request->user()->id);

        return response()->json([
            'success' => true,
            'message' => 'Đã hủy tham dự sự kiện'
        ]);
    }
}
