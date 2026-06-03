<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NguoiDung;
use App\Support\AccessControl;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class NhanVatTieuBieuController extends Controller
{
    public function index(Request $request)
    {
        $familyId = $request->query('dong_ho_id');
        $status = $request->query('trang_thai');

        if ($familyId && !AccessControl::canAccessFamily($request->user(), $familyId)) {
            return AccessControl::forbidden();
        }

        $query = $this->baseQuery();
        AccessControl::scopeFamilyQuery($query, $request->user(), 'nhan_vat_tieu_bieus.dong_ho_id');

        if ($familyId) {
            $query->where('nhan_vat_tieu_bieus.dong_ho_id', $familyId);
        }

        if ($status) {
            $query->where('nhan_vat_tieu_bieus.trang_thai', $status);
        }

        $data = $query
            ->orderByDesc('nhan_vat_tieu_bieus.noi_bat')
            ->orderBy('nhan_vat_tieu_bieus.thu_tu_hien_thi')
            ->orderByDesc('nhan_vat_tieu_bieus.updated_at')
            ->get();

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function detail(Request $request)
    {
        $id = $request->query('id');
        if (!$id) {
            return response()->json(['success' => false, 'message' => 'Thiếu id nhân vật tiêu biểu.'], 422);
        }

        $profile = $this->baseQuery()
            ->where('nhan_vat_tieu_bieus.id', $id)
            ->first();

        if (!$profile) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy hồ sơ nhân vật tiêu biểu.'], 404);
        }

        if (!AccessControl::canAccessFamily($request->user(), $profile->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        $documents = DB::table('tai_lieus')
            ->where('thanh_vien_id', $profile->thanh_vien_id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'profile' => $profile,
                'documents' => $documents,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validatedData($request);
        $member = DB::table('thanh_viens')->where('id', $data['thanh_vien_id'])->first();

        if (!$member) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy thành viên.'], 404);
        }

        if (!AccessControl::canManageFamily($request->user(), $member->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        $exists = DB::table('nhan_vat_tieu_bieus')
            ->where('thanh_vien_id', $member->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Thành viên này đã có hồ sơ nhân vật tiêu biểu.',
            ], 409);
        }

        $cover = $this->storeCover($request, $member->dong_ho_id);
        $now = now();
        $id = DB::table('nhan_vat_tieu_bieus')->insertGetId([
            ...$this->payload($data),
            'dong_ho_id' => $member->dong_ho_id,
            'thanh_vien_id' => $member->id,
            'anh_bia_path' => $cover['path'] ?? null,
            'anh_bia_disk' => $cover['disk'] ?? null,
            'nguoi_cap_nhat_id' => $this->nguoiDungId($request->user()),
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã tạo hồ sơ nhân vật tiêu biểu.',
            'id' => $id,
        ]);
    }

    public function update(Request $request)
    {
        $data = $this->validatedData($request, true);
        $profile = DB::table('nhan_vat_tieu_bieus')->where('id', $data['id'])->first();

        if (!$profile) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy hồ sơ nhân vật tiêu biểu.'], 404);
        }

        if (!AccessControl::canManageFamily($request->user(), $profile->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        $updateData = $this->payload($data);
        if (!empty($data['thanh_vien_id']) && (int) $data['thanh_vien_id'] !== (int) $profile->thanh_vien_id) {
            $memberFamilyId = AccessControl::memberFamilyId($data['thanh_vien_id']);
            if ((int) $memberFamilyId !== (int) $profile->dong_ho_id) {
                return AccessControl::invalidScope('Thành viên không thuộc dòng họ của hồ sơ.');
            }

            $duplicate = DB::table('nhan_vat_tieu_bieus')
                ->where('thanh_vien_id', $data['thanh_vien_id'])
                ->where('id', '<>', $profile->id)
                ->exists();

            if ($duplicate) {
                return response()->json(['success' => false, 'message' => 'Thành viên này đã có hồ sơ nhân vật tiêu biểu.'], 409);
            }

            $updateData['thanh_vien_id'] = $data['thanh_vien_id'];
        }

        if ($request->hasFile('anh_bia')) {
            $cover = $this->storeCover($request, $profile->dong_ho_id);
            $updateData['anh_bia_path'] = $cover['path'];
            $updateData['anh_bia_disk'] = $cover['disk'];
            $this->deleteCover($profile);
        }

        $updateData['nguoi_cap_nhat_id'] = $this->nguoiDungId($request->user());
        $updateData['updated_at'] = now();

        DB::table('nhan_vat_tieu_bieus')->where('id', $profile->id)->update($updateData);

        return response()->json(['success' => true, 'message' => 'Đã cập nhật hồ sơ nhân vật tiêu biểu.']);
    }

    public function destroy(Request $request)
    {
        $data = $request->validate(['id' => ['required', 'integer', 'exists:nhan_vat_tieu_bieus,id']]);
        $profile = DB::table('nhan_vat_tieu_bieus')->where('id', $data['id'])->first();

        if (!$profile) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy hồ sơ nhân vật tiêu biểu.'], 404);
        }

        if (!AccessControl::canManageFamily($request->user(), $profile->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        DB::table('nhan_vat_tieu_bieus')->where('id', $profile->id)->delete();
        $this->deleteCover($profile);

        return response()->json(['success' => true, 'message' => 'Đã xóa hồ sơ nhân vật tiêu biểu.']);
    }

    private function baseQuery()
    {
        return DB::table('nhan_vat_tieu_bieus')
            ->join('thanh_viens', 'nhan_vat_tieu_bieus.thanh_vien_id', '=', 'thanh_viens.id')
            ->leftJoin('nguoi_dungs as nguoi_cap_nhat', 'nhan_vat_tieu_bieus.nguoi_cap_nhat_id', '=', 'nguoi_cap_nhat.id')
            ->select(
                'nhan_vat_tieu_bieus.*',
                DB::raw("CASE WHEN nhan_vat_tieu_bieus.anh_bia_path IS NULL THEN NULL ELSE CONCAT('/storage/', nhan_vat_tieu_bieus.anh_bia_path) END as anh_bia_url"),
                'thanh_viens.ho_ten as ten_thanh_vien',
                'thanh_viens.ten_thuong_goi',
                'thanh_viens.gioi_tinh',
                'thanh_viens.doi_thu',
                'thanh_viens.tinh_trang_song',
                'thanh_viens.ngay_sinh_duong',
                'thanh_viens.ngay_mat_am',
                'thanh_viens.anh_dai_dien',
                'thanh_viens.nghe_nghiep',
                'thanh_viens.tieu_su',
                'nguoi_cap_nhat.ho_ten as ten_nguoi_cap_nhat'
            );
    }

    private function validatedData(Request $request, bool $updating = false): array
    {
        return $request->validate([
            'id' => [$updating ? 'required' : 'sometimes', 'integer', 'exists:nhan_vat_tieu_bieus,id'],
            'thanh_vien_id' => [$updating ? 'sometimes' : 'required', 'integer', 'exists:thanh_viens,id'],
            'tieu_de' => ['nullable', 'string', 'max:255'],
            'tom_tat' => ['nullable', 'string', 'max:2000'],
            'cau_chuyen' => ['nullable', 'string'],
            'dong_gop' => ['nullable', 'string'],
            'linh_vuc' => ['nullable', 'string', 'max:255'],
            'giai_doan' => ['nullable', 'string', 'max:255'],
            'nam_bat_dau' => ['nullable', 'integer', 'min:1', 'max:9999'],
            'nam_ket_thuc' => ['nullable', 'integer', 'min:1', 'max:9999'],
            'noi_bat' => ['nullable', 'boolean'],
            'trang_thai' => ['nullable', 'string', Rule::in(['draft', 'published'])],
            'thu_tu_hien_thi' => ['nullable', 'integer', 'min:0'],
            'anh_bia' => ['nullable', 'image', 'max:10240'],
        ]);
    }

    private function payload(array $data): array
    {
        return [
            'tieu_de' => $data['tieu_de'] ?? null,
            'tom_tat' => $data['tom_tat'] ?? null,
            'cau_chuyen' => $data['cau_chuyen'] ?? null,
            'dong_gop' => $data['dong_gop'] ?? null,
            'linh_vuc' => $data['linh_vuc'] ?? null,
            'giai_doan' => $data['giai_doan'] ?? null,
            'nam_bat_dau' => $data['nam_bat_dau'] ?? null,
            'nam_ket_thuc' => $data['nam_ket_thuc'] ?? null,
            'noi_bat' => (bool) ($data['noi_bat'] ?? false),
            'trang_thai' => $data['trang_thai'] ?? 'published',
            'thu_tu_hien_thi' => $data['thu_tu_hien_thi'] ?? 0,
        ];
    }

    private function storeCover(Request $request, int|string $familyId): ?array
    {
        if (!$request->hasFile('anh_bia')) {
            return null;
        }

        $file = $request->file('anh_bia');
        $disk = 'public';
        $directory = 'nhan-vat-tieu-bieu/dong-ho-' . $familyId . '/' . now()->format('Y/m');
        $filename = Str::uuid() . '.' . $file->extension();
        $path = $file->storeAs($directory, $filename, $disk);

        return ['disk' => $disk, 'path' => $path];
    }

    private function deleteCover(object $profile): void
    {
        if (empty($profile->anh_bia_disk) || empty($profile->anh_bia_path)) {
            return;
        }

        Storage::disk($profile->anh_bia_disk)->delete($profile->anh_bia_path);
    }

    private function nguoiDungId(?Authenticatable $user): ?int
    {
        return $user instanceof NguoiDung ? (int) $user->id : null;
    }
}
