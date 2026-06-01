<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\DongHo;
use App\Models\NguoiDung;
use App\Models\ThanhVien;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function stats(Request $request)
    {
        $totalClans = DongHo::count();
        $totalMembers = ThanhVien::count();
        $totalUsers = NguoiDung::count();
        $pendingApprovals = NguoiDung::where('trang_thai_gia_nhap', 'cho_duyet')->count();

        // Thống kê phân bố thế hệ
        $generationStats = ThanhVien::select('doi_thu as generation', DB::raw('count(*) as total'))
            ->whereNotNull('doi_thu')
            ->groupBy('doi_thu')
            ->orderBy('doi_thu')
            ->get();

        // Phân bố giới tính
        $genderStats = [
            'nam' => ThanhVien::where('gioi_tinh', 'nam')->count(),
            'nu'  => ThanhVien::where('gioi_tinh', 'nu')->count(),
        ];

        // Dòng họ nổi bật kèm số thành viên
        $clans = DongHo::withCount('thanhViens')
            ->orderBy('thanh_viens_count', 'desc')
            ->take(6)
            ->get();

        // Danh sách đăng ký gần đây
        $recentUsers = NguoiDung::with('dongHo:id,ten_dong_ho')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // Danh sách dòng họ mới lập
        $recentClans = DongHo::with('nguoiTao:id,ho_ten,email')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'total_clans'        => $totalClans,
                'total_members'      => $totalMembers,
                'total_users'        => $totalUsers,
                'pending_approvals'  => $pendingApprovals,
                'generation_stats'   => $generationStats,
                'gender_stats'       => $genderStats,
                'clans'              => $clans,
                'recent_users'       => $recentUsers,
                'recent_clans'       => $recentClans,
            ],
        ]);
    }
}
