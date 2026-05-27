<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TaiLieu\CreateTaiLieuRequest;
use App\Http\Requests\TaiLieu\DeleteTaiLieuRequest;
use App\Http\Requests\TaiLieu\UpdateTaiLieuRequest;
use App\Models\NguoiDung;
use App\Support\AccessControl;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

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

        $data = $this->prepareDocumentData($request, $data, $familyId);

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

        $data = $this->prepareDocumentData($request, $data, $familyId, $taiLieu);

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
        $this->deleteStoredFile($taiLieu);

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

    private function prepareDocumentData(Request $request, array $data, ?int $familyId, ?object $existing = null): array
    {
        unset($data['file']);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $disk = 'public';
            $directory = 'tai-lieu/' . ($familyId ?: 'he-thong');
            $path = $file->store($directory, $disk);

            if ($existing) {
                $this->deleteStoredFile($existing);
            }

            $data['duong_dan_file'] = Storage::disk($disk)->url($path);
            $data['loai_file'] = $file->getMimeType() ?: $file->getClientOriginalExtension();
            $data['ten_file_goc'] = $file->getClientOriginalName();
            $data['mime_type'] = $file->getMimeType();
            $data['kich_thuoc'] = $file->getSize();
            $data['disk'] = $disk;
            $data['path'] = $path;
        }

        if (empty($data['loai_file']) && !empty($data['duong_dan_file'])) {
            $extension = strtolower(pathinfo(parse_url($data['duong_dan_file'], PHP_URL_PATH) ?: $data['duong_dan_file'], PATHINFO_EXTENSION));
            $data['loai_file'] = $extension ?: 'other';
        }

        if (empty($data['ten_tai_lieu']) && !empty($data['ten_file_goc'])) {
            $data['ten_tai_lieu'] = pathinfo($data['ten_file_goc'], PATHINFO_FILENAME);
        }

        if (!$existing) {
            $data['nguoi_tai_len_id'] = $this->nguoiDungId($request->user());
            $data['created_at'] = now();
        }

        $data['updated_at'] = now();

        return $data;
    }

    private function deleteStoredFile(object $taiLieu): void
    {
        if (empty($taiLieu->disk) || empty($taiLieu->path)) {
            return;
        }

        Storage::disk($taiLieu->disk)->delete($taiLieu->path);
    }

    private function nguoiDungId(?Authenticatable $user): ?int
    {
        return $user instanceof NguoiDung ? (int) $user->id : null;
    }
}
