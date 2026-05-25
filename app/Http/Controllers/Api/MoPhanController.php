<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MoPhan\CreateMoPhanRequest;
use App\Http\Requests\MoPhan\DeleteMoPhanRequest;
use App\Http\Requests\MoPhan\UpdateMoPhanRequest;
use App\Models\NguoiDung;
use App\Support\AccessControl;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MoPhanController extends Controller
{
    public function index(Request $request)
    {
        if (!$this->canUseMoPhanFeature($request->user())) {
            return AccessControl::forbidden('Tài khoản chưa được duyệt để truy cập mộ phần.');
        }

        $idDongHo = $request->query('dong_ho_id');
        $idThanhVien = $request->query('thanh_vien_id');

        if ($idDongHo && !AccessControl::canAccessFamily($request->user(), $idDongHo)) {
            return AccessControl::forbidden();
        }

        if ($idThanhVien) {
            $familyId = AccessControl::memberFamilyId($idThanhVien);

            if (!$familyId) {
                return response()->json(['success' => false, 'message' => 'Không tìm thấy thành viên'], 404);
            }

            if (!AccessControl::canAccessFamily($request->user(), $familyId)) {
                return AccessControl::forbidden();
            }
        }

        $query = $this->baseQuery();
        AccessControl::scopeFamilyQuery($query, $request->user(), 'mo_phans.dong_ho_id');

        if ($idDongHo) {
            $query->where('mo_phans.dong_ho_id', $idDongHo);
        }

        if ($idThanhVien) {
            $query->where('mo_phans.thanh_vien_id', $idThanhVien);
        }

        $data = $query->orderBy('mo_phans.updated_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function detail(Request $request)
    {
        if (!$this->canUseMoPhanFeature($request->user())) {
            return AccessControl::forbidden('Tài khoản chưa được duyệt để truy cập mộ phần.');
        }

        $id = $request->query('id');
        $idThanhVien = $request->query('thanh_vien_id');

        if (!$id && !$idThanhVien) {
            return response()->json(['success' => false, 'message' => 'Thiếu id hoặc thanh_vien_id'], 422);
        }

        $query = $this->baseQuery();

        if ($id) {
            $query->where('mo_phans.id', $id);
        } else {
            $query->where('mo_phans.thanh_vien_id', $idThanhVien);
        }

        $moPhan = $query->first();

        if (!$moPhan) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy mộ phần'], 404);
        }

        if (!AccessControl::canAccessFamily($request->user(), $moPhan->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        return response()->json([
            'success' => true,
            'data' => $moPhan,
        ]);
    }

    public function store(CreateMoPhanRequest $request)
    {
        $data = $request->validated();
        $thanhVien = DB::table('thanh_viens')->where('id', $data['thanh_vien_id'])->first();

        if (!$thanhVien) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy thành viên'], 404);
        }

        if (!$this->canSaveMoPhan($request->user(), $thanhVien->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        if ((int) $thanhVien->tinh_trang_song !== 0) {
            return response()->json([
                'success' => false,
                'message' => 'Chỉ được lưu tọa độ mộ cho thành viên đã mất.',
            ], 422);
        }

        $exists = DB::table('mo_phans')
            ->where('thanh_vien_id', $data['thanh_vien_id'])
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Mộ phần của thành viên này đã tồn tại.',
            ], 409);
        }

        $id = DB::table('mo_phans')->insertGetId([
            'dong_ho_id' => $thanhVien->dong_ho_id,
            'thanh_vien_id' => $data['thanh_vien_id'],
            'vi_do' => $data['vi_do'],
            'kinh_do' => $data['kinh_do'],
            'ghi_chu' => $data['ghi_chu'] ?? null,
            'nguoi_cap_nhat_id' => $this->nguoiDungId($request->user()),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Lưu tọa độ mộ phần thành công',
            'id' => $id,
        ]);
    }

    public function update(UpdateMoPhanRequest $request)
    {
        $data = $request->validated();
        $moPhan = DB::table('mo_phans')->where('id', $data['id'])->first();

        if (!$moPhan) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy mộ phần'], 404);
        }

        if (!$this->canSaveMoPhan($request->user(), $moPhan->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        $thanhVien = DB::table('thanh_viens')->where('id', $moPhan->thanh_vien_id)->first();
        if (!$thanhVien || (int) $thanhVien->tinh_trang_song !== 0) {
            return response()->json([
                'success' => false,
                'message' => 'Chỉ được cập nhật mộ phần cho thành viên đã mất.',
            ], 422);
        }

        $updateData = [
            'nguoi_cap_nhat_id' => $this->nguoiDungId($request->user()),
            'updated_at' => now(),
        ];

        if (array_key_exists('vi_do', $data)) {
            $updateData['vi_do'] = $data['vi_do'];
        }

        if (array_key_exists('kinh_do', $data)) {
            $updateData['kinh_do'] = $data['kinh_do'];
        }

        if (array_key_exists('ghi_chu', $data)) {
            $updateData['ghi_chu'] = $data['ghi_chu'];
        }

        DB::table('mo_phans')->where('id', $data['id'])->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật tọa độ mộ phần thành công',
        ]);
    }

    public function destroy(DeleteMoPhanRequest $request)
    {
        $data = $request->validated();
        $moPhan = DB::table('mo_phans')->where('id', $data['id'])->first();

        if (!$moPhan) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy mộ phần'], 404);
        }

        if (
            !$this->canUseMoPhanFeature($request->user())
            || !AccessControl::canManageFamily($request->user(), $moPhan->dong_ho_id)
        ) {
            return AccessControl::forbidden();
        }

        DB::table('mo_phans')->where('id', $data['id'])->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa mộ phần thành công',
        ]);
    }

    private function baseQuery()
    {
        return DB::table('mo_phans')
            ->join('thanh_viens', 'mo_phans.thanh_vien_id', '=', 'thanh_viens.id')
            ->leftJoin('nguoi_dungs as nguoi_cap_nhat', 'mo_phans.nguoi_cap_nhat_id', '=', 'nguoi_cap_nhat.id')
            ->select(
                'mo_phans.*',
                'thanh_viens.ho_ten as ten_thanh_vien',
                'thanh_viens.tinh_trang_song',
                'nguoi_cap_nhat.ho_ten as ten_nguoi_cap_nhat'
            );
    }

    private function canUseMoPhanFeature(?Authenticatable $user): bool
    {
        if (AccessControl::isSystemAdmin($user)) {
            return true;
        }

        if (!$user || !AccessControl::familyId($user)) {
            return false;
        }

        return (bool) ($user->trang_thai ?? true)
            && ($user->trang_thai_gia_nhap ?? 'da_duyet') === 'da_duyet';
    }

    private function canSaveMoPhan(?Authenticatable $user, int|string|null $familyId): bool
    {
        return $this->canUseMoPhanFeature($user)
            && AccessControl::canAccessFamily($user, $familyId);
    }

    private function nguoiDungId(?Authenticatable $user): ?int
    {
        return $user instanceof NguoiDung ? (int) $user->id : null;
    }
}
