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
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MoPhanController extends Controller
{
    public function index(Request $request)
    {
        if (!$this->canUseMoPhanFeature($request->user())) {
            return AccessControl::forbidden('Tài khoản chưa được duyệt để truy cập mộ phần.');
        }

        $idDongHo = $request->query('dong_ho_id');
        $idThanhVien = $request->query('thanh_vien_id');
        $doiThu = $request->query('doi_thu');
        $khuMoId = $request->query('khu_mo_id');

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

        if ($doiThu) {
            $query->where('thanh_viens.doi_thu', $doiThu);
        }

        if ($khuMoId) {
            $query->where('mo_phans.khu_mo_id', $khuMoId);
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

    public function history(Request $request)
    {
        if (!$this->canUseMoPhanFeature($request->user())) {
            return AccessControl::forbidden('Tài khoản chưa được duyệt để truy cập mộ phần.');
        }

        $id = $request->query('id');
        if (!$id) {
            return response()->json(['success' => false, 'message' => 'Thiếu id mộ phần'], 422);
        }

        $moPhan = DB::table('mo_phans')->where('id', $id)->first();
        if (!$moPhan) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy mộ phần'], 404);
        }

        if (!AccessControl::canAccessFamily($request->user(), $moPhan->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        $data = DB::table('mo_phan_lich_sus')
            ->leftJoin('nguoi_dungs', 'mo_phan_lich_sus.nguoi_cap_nhat_id', '=', 'nguoi_dungs.id')
            ->where('mo_phan_lich_sus.mo_phan_id', $id)
            ->orderBy('mo_phan_lich_sus.created_at', 'desc')
            ->select('mo_phan_lich_sus.*', 'nguoi_dungs.ho_ten as ten_nguoi_cap_nhat')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data,
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

        if (!$this->validKhuMo($data['khu_mo_id'] ?? null, $thanhVien->dong_ho_id)) {
            return AccessControl::invalidScope('Khu mộ không thuộc dòng họ của thành viên.');
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

        $photo = $this->storePhoto($request, $thanhVien->dong_ho_id);
        $now = now();
        $id = DB::table('mo_phans')->insertGetId([
            'dong_ho_id' => $thanhVien->dong_ho_id,
            'thanh_vien_id' => $data['thanh_vien_id'],
            'khu_mo_id' => $data['khu_mo_id'] ?? null,
            'vi_do' => $data['vi_do'],
            'kinh_do' => $data['kinh_do'],
            'ghi_chu' => $data['ghi_chu'] ?? null,
            'anh_mo_path' => $photo['path'] ?? null,
            'anh_mo_disk' => $photo['disk'] ?? null,
            'nguoi_cap_nhat_id' => $this->nguoiDungId($request->user()),
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $this->recordHistory($id, null, [
            'vi_do' => $data['vi_do'],
            'kinh_do' => $data['kinh_do'],
            'ghi_chu' => $data['ghi_chu'] ?? null,
            'anh_mo_path' => $photo['path'] ?? null,
        ], $this->nguoiDungId($request->user()));

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

        if (!$this->validKhuMo($data['khu_mo_id'] ?? null, $moPhan->dong_ho_id)) {
            return AccessControl::invalidScope('Khu mộ không thuộc dòng họ của mộ phần.');
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

        if (array_key_exists('khu_mo_id', $data)) {
            $updateData['khu_mo_id'] = $data['khu_mo_id'];
        }

        if ($request->hasFile('anh_mo')) {
            $photo = $this->storePhoto($request, $moPhan->dong_ho_id);
            $updateData['anh_mo_path'] = $photo['path'];
            $updateData['anh_mo_disk'] = $photo['disk'];
            $this->deletePhoto($moPhan);
        }

        DB::table('mo_phans')->where('id', $data['id'])->update($updateData);
        $updated = DB::table('mo_phans')->where('id', $data['id'])->first();
        $this->recordHistory((int) $data['id'], $moPhan, $updated, $this->nguoiDungId($request->user()));

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
        $this->deletePhoto($moPhan);

        return response()->json([
            'success' => true,
            'message' => 'Xóa mộ phần thành công',
        ]);
    }

    private function baseQuery()
    {
        return DB::table('mo_phans')
            ->join('thanh_viens', 'mo_phans.thanh_vien_id', '=', 'thanh_viens.id')
            ->leftJoin('khu_mos', 'mo_phans.khu_mo_id', '=', 'khu_mos.id')
            ->leftJoin('nguoi_dungs as nguoi_cap_nhat', 'mo_phans.nguoi_cap_nhat_id', '=', 'nguoi_cap_nhat.id')
            ->select(
                'mo_phans.*',
                DB::raw("CASE WHEN mo_phans.anh_mo_path IS NULL THEN NULL ELSE CONCAT('/storage/', mo_phans.anh_mo_path) END as anh_mo_url"),
                'thanh_viens.ho_ten as ten_thanh_vien',
                'thanh_viens.doi_thu',
                'thanh_viens.tinh_trang_song',
                'khu_mos.ten_khu_mo',
                'khu_mos.dia_chi as dia_chi_khu_mo',
                'khu_mos.vi_do as vi_do_khu_mo',
                'khu_mos.kinh_do as kinh_do_khu_mo',
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

    private function validKhuMo(int|string|null $khuMoId, int|string $familyId): bool
    {
        if (!$khuMoId) {
            return true;
        }

        return DB::table('khu_mos')
            ->where('id', $khuMoId)
            ->where('dong_ho_id', $familyId)
            ->exists();
    }

    private function storePhoto(Request $request, int|string $familyId): ?array
    {
        if (!$request->hasFile('anh_mo')) {
            return null;
        }

        $disk = 'public';
        $file = $request->file('anh_mo');
        $directory = 'mo-phan/dong-ho-' . $familyId . '/' . now()->format('Y/m');
        $filename = Str::uuid() . '.' . $file->extension();
        $path = $file->storeAs($directory, $filename, $disk);

        return ['disk' => $disk, 'path' => $path];
    }

    private function deletePhoto(object $moPhan): void
    {
        if (empty($moPhan->anh_mo_disk) || empty($moPhan->anh_mo_path)) {
            return;
        }

        Storage::disk($moPhan->anh_mo_disk)->delete($moPhan->anh_mo_path);
    }

    private function recordHistory(int $moPhanId, ?object $old, object|array $new, ?int $userId): void
    {
        $newData = (object) $new;

        DB::table('mo_phan_lich_sus')->insert([
            'mo_phan_id' => $moPhanId,
            'nguoi_cap_nhat_id' => $userId,
            'vi_do_cu' => $old->vi_do ?? null,
            'kinh_do_cu' => $old->kinh_do ?? null,
            'vi_do_moi' => $newData->vi_do ?? null,
            'kinh_do_moi' => $newData->kinh_do ?? null,
            'ghi_chu_cu' => $old->ghi_chu ?? null,
            'ghi_chu_moi' => $newData->ghi_chu ?? null,
            'anh_mo_cu' => $old->anh_mo_path ?? null,
            'anh_mo_moi' => $newData->anh_mo_path ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
