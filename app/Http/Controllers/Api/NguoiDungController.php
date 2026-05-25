<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\NguoiDung\CreateNguoiDungRequest;
use App\Http\Requests\NguoiDung\UpdateNguoiDungRequest;
use App\Http\Requests\NguoiDung\DeleteNguoiDungRequest;
use App\Support\AccessControl;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class NguoiDungController extends Controller
{
    public function index(Request $request)
    {
        $idDongHo = $request->query('dong_ho_id');
        $query = DB::table('nguoi_dungs');

        if ($idDongHo && !AccessControl::canAccessFamily($request->user(), $idDongHo)) {
            return AccessControl::forbidden();
        }

        AccessControl::scopeFamilyQuery($query, $request->user());

        if ($idDongHo) {
            $query->where('dong_ho_id', $idDongHo);
        }

        $data = $query->get();

        // Xoá password khỏi response
        $data = $data->map(function ($item) {
            unset($item->password);
            return $item;
        });

        return response()->json([
            'success'   => true,
            'data'      => $data
        ]);
    }

    public function store(CreateNguoiDungRequest $request)
    {
        $data = $request->validated();
        $user = $request->user();

        if (!AccessControl::isSystemAdmin($user)) {
            $data['dong_ho_id'] = AccessControl::familyId($user);

            if (($data['quyen_han'] ?? 'thanh_vien') !== 'thanh_vien') {
                return AccessControl::forbidden('Quan ly dong ho chi duoc tao tai khoan thanh vien.');
            }
        } elseif (!empty($data['thanh_vien_id']) && empty($data['dong_ho_id'])) {
            $data['dong_ho_id'] = AccessControl::memberFamilyId($data['thanh_vien_id']);
        }

        if (!AccessControl::canManageFamily($user, $data['dong_ho_id'] ?? null)) {
            return AccessControl::forbidden();
        }

        if (!empty($data['thanh_vien_id']) && !AccessControl::allMembersInFamily([$data['thanh_vien_id']], $data['dong_ho_id'])) {
            return AccessControl::invalidScope('Thanh vien lien ket khong thuoc dong ho duoc phep.');
        }
        
        $data['password']   = Hash::make($data['password']);
        $data['quyen_han']  = $data['quyen_han'] ?? 'thanh_vien';
        $data['created_at'] = now();
        $data['updated_at'] = now();

        $id = DB::table('nguoi_dungs')->insertGetId($data);

        return response()->json([
            'success'   => true,
            'message'   => 'Tạo người dùng thành công',
            'id'        => $id
        ]);
    }

    public function update(UpdateNguoiDungRequest $request)
    {
        $data = $request->validated();
        $user = $request->user();
        $id = $data['id'];
        unset($data['id']);
        $target = DB::table('nguoi_dungs')->where('id', $id)->first();

        if (!$target) {
            return response()->json(['success' => false, 'message' => 'Khong tim thay'], 404);
        }

        if (!AccessControl::canManageFamily($user, $target->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        $targetFamilyId = array_key_exists('dong_ho_id', $data) ? $data['dong_ho_id'] : $target->dong_ho_id;

        if (array_key_exists('thanh_vien_id', $data) && !empty($data['thanh_vien_id']) && empty($targetFamilyId)) {
            $targetFamilyId = AccessControl::memberFamilyId($data['thanh_vien_id']);
            $data['dong_ho_id'] = $targetFamilyId;
        }

        if (!AccessControl::canManageFamily($user, $targetFamilyId)) {
            return AccessControl::forbidden();
        }

        if (!AccessControl::isSystemAdmin($user)) {
            if (array_key_exists('dong_ho_id', $data)) {
                $data['dong_ho_id'] = AccessControl::familyId($user);
                $targetFamilyId = $data['dong_ho_id'];
            }

            if (array_key_exists('quyen_han', $data) && $data['quyen_han'] !== 'thanh_vien') {
                return AccessControl::forbidden('Quan ly dong ho khong duoc cap quyen quan tri.');
            }
        }

        if (!empty($data['thanh_vien_id']) && !AccessControl::allMembersInFamily([$data['thanh_vien_id']], $targetFamilyId)) {
            return AccessControl::invalidScope('Thanh vien lien ket khong thuoc dong ho duoc phep.');
        }

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $data['updated_at'] = now();

        DB::table('nguoi_dungs')->where('id', $id)->update($data);

        return response()->json([
            'success'   => true,
            'message'   => 'Cập nhật người dùng thành công'
        ]);
    }

    public function destroy(DeleteNguoiDungRequest $request)
    {
        $data = $request->validated();
        $user = $request->user();
        $target = DB::table('nguoi_dungs')->where('id', $data['id'])->first();

        if (!$target) {
            return response()->json(['success' => false, 'message' => 'Khong tim thay'], 404);
        }

        if ((int) $target->id === (int) $user->id && get_class($user) === \App\Models\NguoiDung::class) {
            return AccessControl::forbidden('Khong the xoa chinh tai khoan dang dang nhap.');
        }

        if (!AccessControl::canManageFamily($user, $target->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        if (!AccessControl::isSystemAdmin($user) && $target->quyen_han !== 'thanh_vien') {
            return AccessControl::forbidden('Quan ly dong ho chi duoc xoa tai khoan thanh vien.');
        }
        
        DB::table('nguoi_dungs')->where('id', $data['id'])->delete();

        return response()->json([
            'success'   => true,
            'message'   => 'Xóa người dùng thành công'
        ]);
    }
}
