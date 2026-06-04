<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\AccessControl;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GlobalSearchController extends Controller
{
    public function __invoke(Request $request)
    {
        $query = trim((string) $request->query('q', ''));

        if (mb_strlen($query) < 2) {
            return response()->json([
                'success' => true,
                'data' => [],
            ]);
        }

        $user = $request->user();
        $keyword = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $query) . '%';
        $results = [];
        $isSystemAdmin = AccessControl::isSystemAdmin($user);

        if ($isSystemAdmin) {
            $results = array_merge(
                $results,
                $this->searchClans($keyword),
                $this->searchUsers($keyword),
                $this->searchMembers($keyword, null, true)
            );
        }

        $familyId = AccessControl::familyId($user);

        if ($familyId) {
            $results = array_merge(
                $results,
                $this->searchMembers($keyword, $familyId),
                $this->searchDocuments($keyword, $familyId),
                $this->searchEvents($keyword, $familyId),
                $this->searchGraves($keyword, $familyId),
                $this->searchGraveAreas($keyword, $familyId)
            );
        }

        return response()->json([
            'success' => true,
            'data' => array_slice($results, 0, 12),
        ]);
    }

    private function searchClans(string $keyword): array
    {
        return DB::table('dong_hos')
            ->where(function ($query) use ($keyword) {
                $query->where('ten_dong_ho', 'like', $keyword)
                    ->orWhere('dia_chi_tu_duong', 'like', $keyword)
                    ->orWhere('mo_ta', 'like', $keyword);
            })
            ->limit(4)
            ->get()
            ->map(fn ($row) => [
                'type' => 'clan',
                'label' => 'Dòng họ',
                'title' => $row->ten_dong_ho,
                'subtitle' => $row->dia_chi_tu_duong ?: 'Quản lý dòng họ',
                'url' => '/admin/dong-ho',
            ])
            ->all();
    }

    private function searchUsers(string $keyword): array
    {
        return DB::table('nguoi_dungs')
            ->leftJoin('dong_hos', 'dong_hos.id', '=', 'nguoi_dungs.dong_ho_id')
            ->where(function ($query) use ($keyword) {
                $query->where('nguoi_dungs.ho_ten', 'like', $keyword)
                    ->orWhere('nguoi_dungs.email', 'like', $keyword)
                    ->orWhere('dong_hos.ten_dong_ho', 'like', $keyword);
            })
            ->select('nguoi_dungs.id', 'nguoi_dungs.ho_ten', 'nguoi_dungs.email', 'nguoi_dungs.quyen_han', 'dong_hos.ten_dong_ho')
            ->limit(4)
            ->get()
            ->map(fn ($row) => [
                'type' => 'user',
                'label' => 'Người dùng',
                'title' => $row->ho_ten ?: $row->email,
                'subtitle' => trim(($row->email ?: '') . ($row->ten_dong_ho ? ' · ' . $row->ten_dong_ho : '')),
                'url' => '/admin/nguoi-dung',
            ])
            ->all();
    }

    private function searchMembers(string $keyword, ?int $familyId, bool $adminUrl = false): array
    {
        $query = DB::table('thanh_viens')
            ->where(function ($query) use ($keyword) {
                $query->where('ho_ten', 'like', $keyword)
                    ->orWhere('ten_thuong_goi', 'like', $keyword)
                    ->orWhere('ma_thanh_vien', 'like', $keyword)
                    ->orWhere('nghe_nghiep', 'like', $keyword)
                    ->orWhere('dia_chi', 'like', $keyword)
                    ->orWhere('cho_o_hien_tai', 'like', $keyword);
            });

        if ($familyId) {
            $query->where('dong_ho_id', $familyId);
        }

        return $query
            ->select('id', 'ho_ten', 'ten_thuong_goi', 'ma_thanh_vien', 'doi_thu', 'tinh_trang_song')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'type' => 'member',
                'label' => 'Thành viên',
                'title' => $row->ho_ten,
                'subtitle' => trim(($row->ma_thanh_vien ? $row->ma_thanh_vien . ' · ' : '') . 'Đời ' . ($row->doi_thu ?: '?') . ' · ' . ((int) $row->tinh_trang_song === 1 ? 'Còn sống' : 'Đã mất')),
                'url' => ($adminUrl ? '/admin/thanh-vien/' : '/gia-pha/thanh-vien/') . $row->id,
            ])
            ->all();
    }

    private function searchDocuments(string $keyword, ?int $familyId): array
    {
        $query = DB::table('tai_lieus')
            ->leftJoin('thanh_viens', 'thanh_viens.id', '=', 'tai_lieus.thanh_vien_id')
            ->where(function ($query) use ($keyword) {
                $query->where('tai_lieus.ten_tai_lieu', 'like', $keyword)
                    ->orWhere('tai_lieus.mo_ta', 'like', $keyword)
                    ->orWhere('tai_lieus.ten_file_goc', 'like', $keyword)
                    ->orWhere('tai_lieus.du_lieu_orc', 'like', $keyword)
                    ->orWhere('thanh_viens.ho_ten', 'like', $keyword);
            });

        if ($familyId) {
            $query->where(function ($query) use ($familyId) {
                $query->where('tai_lieus.dong_ho_id', $familyId)
                    ->orWhere('thanh_viens.dong_ho_id', $familyId);
            });
        }

        return $query
            ->select('tai_lieus.id', 'tai_lieus.ten_tai_lieu', 'tai_lieus.ten_file_goc', 'tai_lieus.loai_file', 'thanh_viens.ho_ten')
            ->limit(4)
            ->get()
            ->map(fn ($row) => [
                'type' => 'document',
                'label' => 'Tài liệu',
                'title' => $row->ten_tai_lieu ?: ($row->ten_file_goc ?: 'Tài liệu #' . $row->id),
                'subtitle' => trim(($row->loai_file ?: 'Tư liệu') . ($row->ho_ten ? ' · ' . $row->ho_ten : '')),
                'url' => '/gia-pha/tai-lieu',
            ])
            ->all();
    }

    private function searchEvents(string $keyword, ?int $familyId): array
    {
        $query = DB::table('su_kiens')
            ->where(function ($query) use ($keyword) {
                $query->where('ten_su_kien', 'like', $keyword)
                    ->orWhere('loai_su_kien', 'like', $keyword)
                    ->orWhere('dia_diem', 'like', $keyword)
                    ->orWhere('mo_ta', 'like', $keyword);
            });

        if ($familyId) {
            $query->where('dong_ho_id', $familyId);
        }

        return $query
            ->select('id', 'ten_su_kien', 'loai_su_kien', 'ngay_duong', 'dia_diem')
            ->limit(4)
            ->get()
            ->map(fn ($row) => [
                'type' => 'event',
                'label' => 'Sự kiện',
                'title' => $row->ten_su_kien,
                'subtitle' => trim(($row->ngay_duong ?: 'Chưa có ngày') . ($row->dia_diem ? ' · ' . $row->dia_diem : '')),
                'url' => '/gia-pha/events',
            ])
            ->all();
    }

    private function searchGraves(string $keyword, ?int $familyId): array
    {
        $query = DB::table('mo_phans')
            ->join('thanh_viens', 'thanh_viens.id', '=', 'mo_phans.thanh_vien_id')
            ->leftJoin('khu_mos', 'khu_mos.id', '=', 'mo_phans.khu_mo_id')
            ->where(function ($query) use ($keyword) {
                $query->where('thanh_viens.ho_ten', 'like', $keyword)
                    ->orWhere('mo_phans.ghi_chu', 'like', $keyword)
                    ->orWhere('khu_mos.ten_khu_mo', 'like', $keyword)
                    ->orWhere('khu_mos.dia_chi', 'like', $keyword);
            });

        if ($familyId) {
            $query->where('mo_phans.dong_ho_id', $familyId);
        }

        return $query
            ->select('mo_phans.id', 'mo_phans.thanh_vien_id', 'thanh_viens.ho_ten', 'khu_mos.ten_khu_mo', 'khu_mos.dia_chi')
            ->limit(4)
            ->get()
            ->map(fn ($row) => [
                'type' => 'grave',
                'label' => 'Mộ phần',
                'title' => 'Mộ phần ' . $row->ho_ten,
                'subtitle' => trim(($row->ten_khu_mo ?: 'Chưa chọn khu mộ') . ($row->dia_chi ? ' · ' . $row->dia_chi : '')),
                'url' => '/gia-pha/mo-phan?thanh_vien_id=' . $row->thanh_vien_id,
            ])
            ->all();
    }

    private function searchGraveAreas(string $keyword, ?int $familyId): array
    {
        $query = DB::table('khu_mos')
            ->where(function ($query) use ($keyword) {
                $query->where('ten_khu_mo', 'like', $keyword)
                    ->orWhere('dia_chi', 'like', $keyword)
                    ->orWhere('mo_ta', 'like', $keyword);
            });

        if ($familyId) {
            $query->where('dong_ho_id', $familyId);
        }

        return $query
            ->select('id', 'ten_khu_mo', 'dia_chi')
            ->limit(3)
            ->get()
            ->map(fn ($row) => [
                'type' => 'grave_area',
                'label' => 'Khu mộ',
                'title' => $row->ten_khu_mo,
                'subtitle' => $row->dia_chi ?: 'Khu an nghỉ dòng họ',
                'url' => '/gia-pha/mo-phan',
            ])
            ->all();
    }
}
