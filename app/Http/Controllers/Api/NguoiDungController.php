<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\NguoiDung\CreateNguoiDungRequest;
use App\Http\Requests\NguoiDung\UpdateNguoiDungRequest;
use App\Http\Requests\NguoiDung\DeleteNguoiDungRequest;
use App\Http\Requests\NguoiDung\ProvisionMemberAccountRequest;
use App\Http\Requests\NguoiDung\UpdateNguoiDungRoleRequest;
use App\Jobs\SendMemberAccountProvisionedMailJob;
use App\Support\AccessControl;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

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

    public function provisionMemberAccount(ProvisionMemberAccountRequest $request)
    {
        $data = $request->validated();
        $user = $request->user();

        $member = DB::table('thanh_viens')->where('id', $data['thanh_vien_id'])->first();
        if (!$member) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy thành viên.'], 404);
        }

        if (!AccessControl::canManageFamily($user, $member->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        if (DB::table('nguoi_dungs')->where('thanh_vien_id', $member->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Thành viên này đã có tài khoản truy cập hệ thống.',
            ], 422);
        }

        $temporaryPassword = $this->generateTemporaryPassword();
        $dongHoName = DB::table('dong_hos')->where('id', $member->dong_ho_id)->value('ten_dong_ho');

        $id = DB::transaction(function () use ($data, $member, $temporaryPassword) {
            return DB::table('nguoi_dungs')->insertGetId([
                'dong_ho_id' => $member->dong_ho_id,
                'ho_ten' => $member->ho_ten,
                'email' => $data['email'],
                'password' => Hash::make($temporaryPassword),
                'thanh_vien_id' => $member->id,
                'quyen_han' => 'thanh_vien',
                'trang_thai_gia_nhap' => 'da_duyet',
                'trang_thai' => true,
                'avatar' => $member->anh_dai_dien,
                'tieu_su' => $member->tieu_su,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        SendMemberAccountProvisionedMailJob::dispatch(
            $data['email'],
            $member->ho_ten,
            $temporaryPassword,
            url('/login'),
            $dongHoName,
        )->afterCommit();

        return response()->json([
            'success' => true,
            'message' => 'Đã cấp tài khoản và đưa email thông báo vào hàng đợi gửi.',
            'id' => $id,
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

    public function updateRole(UpdateNguoiDungRoleRequest $request)
    {
        $data = $request->validated();
        $user = $request->user();
        $target = DB::table('nguoi_dungs')->where('id', $data['id'])->first();

        if (!$target) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy tài khoản thành viên.'], 404);
        }

        if (!AccessControl::canManageFamily($user, $target->dong_ho_id) || !AccessControl::isFamilyRoleManager($user)) {
            return AccessControl::forbidden('Bạn không có quyền cập nhật vai trò thành viên.');
        }

        if ((int) ($target->id ?? 0) === (int) ($user->id ?? 0) && get_class($user) === \App\Models\NguoiDung::class) {
            return AccessControl::forbidden('Không thể tự thay đổi vai trò của chính mình.');
        }

        if (empty($target->thanh_vien_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Chỉ có thể phân quyền cho tài khoản đã liên kết với thành viên trong gia phả.',
            ], 422);
        }

        if (in_array($target->quyen_han, ['admin', 'truong_toc'], true)) {
            return AccessControl::forbidden('Không thể thay đổi vai trò của tài khoản cấp cao hơn.');
        }

        if ($target->quyen_han === 'quan_ly' && $data['quyen_han'] === 'thanh_vien') {
            $remainingManagers = DB::table('nguoi_dungs')
                ->where('dong_ho_id', $target->dong_ho_id)
                ->where('id', '!=', $target->id)
                ->whereIn('quyen_han', ['truong_toc', 'quan_ly'])
                ->count();

            if ($remainingManagers === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể thu hồi người quản lý cuối cùng của dòng họ.',
                ], 422);
            }
        }

        DB::table('nguoi_dungs')
            ->where('id', $target->id)
            ->update([
                'quyen_han' => $data['quyen_han'],
                'updated_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => $data['quyen_han'] === 'quan_ly'
                ? 'Đã cấp quyền quản lý cho thành viên.'
                : 'Đã thu hồi quyền quản lý của thành viên.',
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

    private function generateTemporaryPassword(): string
    {
        return Str::upper(Str::random(4)) . '-' . Str::random(4) . '-' . random_int(1000, 9999);
    }
}
