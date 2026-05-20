<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuKien\CreateSuKienRequest;
use App\Http\Requests\SuKien\UpdateSuKienRequest;
use App\Http\Requests\SuKien\DeleteSuKienRequest;
use App\Support\AccessControl;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SuKienController extends Controller
{
    public function index(Request $request)
    {
        $idDongHo = $request->query('dong_ho_id');
        $query = DB::table('su_kiens');

        if ($idDongHo && !AccessControl::canAccessFamily($request->user(), $idDongHo)) {
            return AccessControl::forbidden();
        }

        AccessControl::scopeFamilyQuery($query, $request->user());

        if ($idDongHo) {
            $query->where('dong_ho_id', $idDongHo);
        }

        $data = $query->get();

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
        $data['created_at']       = now();
        $data['updated_at']       = now();

        $id = DB::table('su_kiens')->insertGetId($data);

        return response()->json([
            'success'   => true,
            'message'   => 'Tạo sự kiện thành công',
            'id'        => $id
        ]);
    }

    public function update(UpdateSuKienRequest $request)
    {
        $data = $request->validated();
        $id = $data['id'];
        unset($data['id']);
        $suKien = DB::table('su_kiens')->where('id', $id)->first();

        if (!$suKien) {
            return response()->json(['success' => false, 'message' => 'Khong tim thay'], 404);
        }

        if (!AccessControl::canManageFamily($request->user(), $suKien->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        if (array_key_exists('dong_ho_id', $data) && !AccessControl::canManageFamily($request->user(), $data['dong_ho_id'])) {
            return AccessControl::forbidden();
        }

        $data['updated_at'] = now();

        DB::table('su_kiens')->where('id', $id)->update($data);

        return response()->json([
            'success'   => true,
            'message'   => 'Cập nhật sự kiện thành công'
        ]);
    }

    public function destroy(DeleteSuKienRequest $request)
    {
        $data = $request->validated();
        $suKien = DB::table('su_kiens')->where('id', $data['id'])->first();

        if (!$suKien) {
            return response()->json(['success' => false, 'message' => 'Khong tim thay'], 404);
        }

        if (!AccessControl::canManageFamily($request->user(), $suKien->dong_ho_id)) {
            return AccessControl::forbidden();
        }
        
        DB::table('su_kiens')->where('id', $data['id'])->delete();

        return response()->json([
            'success'   => true,
            'message'   => 'Xóa sự kiện thành công'
        ]);
    }
}
