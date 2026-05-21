<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TaiLieu\CreateTaiLieuRequest;
use App\Http\Requests\TaiLieu\DeleteTaiLieuRequest;
use App\Http\Requests\TaiLieu\UpdateTaiLieuRequest;
use App\Support\AccessControl;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TaiLieuController extends Controller
{
    public function index(Request $request)
    {
        $idDongHo = $request->query('dong_ho_id');
        $idThanhVien = $request->query('thanh_vien_id');

        if ($idDongHo && !AccessControl::canAccessFamily($request->user(), $idDongHo)) {
            return AccessControl::forbidden();
        }

        if ($idThanhVien && !AccessControl::canAccessFamily($request->user(), AccessControl::memberFamilyId($idThanhVien))) {
            return AccessControl::forbidden();
        }

        $query = DB::table('tai_lieus')
            ->leftJoin('thanh_viens', 'tai_lieus.thanh_vien_id', '=', 'thanh_viens.id')
            ->select('tai_lieus.*');

        if (!AccessControl::isSystemAdmin($request->user())) {
            $familyId = AccessControl::familyId($request->user());
            $query->where(function ($query) use ($familyId) {
                $query->where('tai_lieus.dong_ho_id', $familyId)
                    ->orWhere('thanh_viens.dong_ho_id', $familyId);
            });
        }

        if ($idDongHo) {
            $query->where('tai_lieus.dong_ho_id', $idDongHo);
        }

        if ($idThanhVien) {
            $query->where('tai_lieus.thanh_vien_id', $idThanhVien);
        }

        $data = $query->get();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function store(CreateTaiLieuRequest $request)
    {
        $data = $request->validated();
        $familyId = $this->resolveDocumentFamilyId($data);

        if (!$familyId && !AccessControl::isSystemAdmin($request->user())) {
            return AccessControl::invalidScope('Tai lieu can gan voi mot dong ho hoac thanh vien.');
        }

        if (!AccessControl::canManageFamily($request->user(), $familyId)) {
            return AccessControl::forbidden();
        }

        if (!empty($data['thanh_vien_id']) && !empty($data['dong_ho_id']) && AccessControl::memberFamilyId($data['thanh_vien_id']) !== (int) $data['dong_ho_id']) {
            return AccessControl::invalidScope('Thanh vien va tai lieu khong cung dong ho.');
        }

        if (empty($data['dong_ho_id']) && $familyId) {
            $data['dong_ho_id'] = $familyId;
        }

        $data['created_at'] = now();
        $data['updated_at'] = now();

        $id = DB::table('tai_lieus')->insertGetId($data);

        return response()->json([
            'success' => true,
            'message' => 'Tao tai lieu thanh cong',
            'id' => $id,
        ]);
    }

    public function update(UpdateTaiLieuRequest $request)
    {
        $data = $request->validated();
        $id = $data['id'];
        unset($data['id']);

        $taiLieu = DB::table('tai_lieus')->where('id', $id)->first();

        if (!$taiLieu) {
            return response()->json(['success' => false, 'message' => 'Khong tim thay'], 404);
        }

        if (!AccessControl::canManageFamily($request->user(), AccessControl::documentFamilyId($taiLieu))) {
            return AccessControl::forbidden();
        }

        $targetData = array_merge((array) $taiLieu, $data);
        $familyId = $this->resolveDocumentFamilyId($targetData);

        if (!AccessControl::canManageFamily($request->user(), $familyId)) {
            return AccessControl::forbidden();
        }

        if (!empty($targetData['thanh_vien_id']) && !empty($targetData['dong_ho_id']) && AccessControl::memberFamilyId($targetData['thanh_vien_id']) !== (int) $targetData['dong_ho_id']) {
            return AccessControl::invalidScope('Thanh vien va tai lieu khong cung dong ho.');
        }

        $data['updated_at'] = now();

        DB::table('tai_lieus')->where('id', $id)->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Cap nhat tai lieu thanh cong',
        ]);
    }

    public function destroy(DeleteTaiLieuRequest $request)
    {
        $data = $request->validated();
        $taiLieu = DB::table('tai_lieus')->where('id', $data['id'])->first();

        if (!$taiLieu) {
            return response()->json(['success' => false, 'message' => 'Khong tim thay'], 404);
        }

        if (!AccessControl::canManageFamily($request->user(), AccessControl::documentFamilyId($taiLieu))) {
            return AccessControl::forbidden();
        }

        DB::table('tai_lieus')->where('id', $data['id'])->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xoa tai lieu thanh cong',
        ]);
    }

    private function resolveDocumentFamilyId(array $data): ?int
    {
        if (!empty($data['dong_ho_id'])) {
            return (int) $data['dong_ho_id'];
        }

        return AccessControl::memberFamilyId($data['thanh_vien_id'] ?? null);
    }
}
