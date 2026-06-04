<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CacheXungHo\CreateCacheXungHoRequest;
use App\Http\Requests\CacheXungHo\DeleteCacheXungHoRequest;
use App\Http\Requests\CacheXungHo\UpdateCacheXungHoRequest;
use App\Support\AccessControl;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CacheXungHoController extends Controller
{
    public function index(Request $request)
    {
        $idDongHo = $request->query('dong_ho_id');

        if ($idDongHo && !AccessControl::canAccessFamily($request->user(), $idDongHo)) {
            return AccessControl::forbidden();
        }

        $query = DB::table('cache_xung_ho');
        AccessControl::scopeFamilyQuery($query, $request->user());

        if ($idDongHo) {
            $query->where('dong_ho_id', $idDongHo);
        }

        $data = $query->get();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function store(CreateCacheXungHoRequest $request)
    {
        $data = $request->validated();

        if (!$this->cacheScopeIsValid($data)) {
            return AccessControl::invalidScope('Cache xung ho phai nam trong cung mot dong ho.');
        }

        if (!AccessControl::canManageFamily($request->user(), $data['dong_ho_id'])) {
            return AccessControl::forbidden();
        }

        $data['created_at'] = now();
        $data['updated_at'] = now();

        $id = DB::table('cache_xung_ho')->insertGetId($data);

        return response()->json([
            'success' => true,
            'message' => 'Tao cache xung ho thanh cong',
            'id' => $id,
        ]);
    }

    public function update(UpdateCacheXungHoRequest $request)
    {
        $data = $request->validated();
        $id = $data['id'];
        unset($data['id']);

        $cache = DB::table('cache_xung_ho')->where('id', $id)->first();

        if (!$cache) {
            return response()->json(['success' => false, 'message' => 'Khong tim thay'], 404);
        }

        if (!AccessControl::canManageFamily($request->user(), $cache->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        $targetData = array_merge((array) $cache, $data);

        if (!$this->cacheScopeIsValid($targetData)) {
            return AccessControl::invalidScope('Cache xung ho phai nam trong cung mot dong ho.');
        }

        if (!AccessControl::canManageFamily($request->user(), $targetData['dong_ho_id'])) {
            return AccessControl::forbidden();
        }

        $data['updated_at'] = now();

        DB::table('cache_xung_ho')->where('id', $id)->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Cap nhat cache xung ho thanh cong',
        ]);
    }

    public function destroy(DeleteCacheXungHoRequest $request)
    {
        $data = $request->validated();
        $cache = DB::table('cache_xung_ho')->where('id', $data['id'])->first();

        if (!$cache) {
            return response()->json(['success' => false, 'message' => 'Khong tim thay'], 404);
        }

        if (!AccessControl::canManageFamily($request->user(), $cache->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        DB::table('cache_xung_ho')->where('id', $data['id'])->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xoa cache xung ho thanh cong',
        ]);
    }

    private function cacheScopeIsValid(array $data): bool
    {
        return AccessControl::allMembersInFamily(
            [$data['nguoi_goi_id'] ?? null, $data['nguoi_nghe_id'] ?? null],
            $data['dong_ho_id'] ?? 0
        );
    }
}
