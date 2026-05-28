<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NguoiDung;
use App\Support\AccessControl;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class KhuMoController extends Controller
{
    public function index(Request $request)
    {
        $idDongHo = $request->query('dong_ho_id');

        if ($idDongHo && !AccessControl::canAccessFamily($request->user(), $idDongHo)) {
            return AccessControl::forbidden();
        }

        $query = $this->baseQuery();
        AccessControl::scopeFamilyQuery($query, $request->user(), 'khu_mos.dong_ho_id');

        if ($idDongHo) {
            $query->where('khu_mos.dong_ho_id', $idDongHo);
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('khu_mos.ten_khu_mo')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules());

        if (!AccessControl::canManageFamily($request->user(), $data['dong_ho_id'])) {
            return AccessControl::forbidden();
        }

        $photo = $this->storePhoto($request, $data['dong_ho_id']);
        $id = DB::table('khu_mos')->insertGetId([
            'dong_ho_id' => $data['dong_ho_id'],
            'ten_khu_mo' => $data['ten_khu_mo'],
            'dia_chi' => $data['dia_chi'] ?? null,
            'vi_do' => $data['vi_do'],
            'kinh_do' => $data['kinh_do'],
            'mo_ta' => $data['mo_ta'] ?? null,
            'anh_khu_mo_path' => $photo['path'] ?? null,
            'anh_khu_mo_disk' => $photo['disk'] ?? null,
            'nguoi_cap_nhat_id' => $this->nguoiDungId($request->user()),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Đã tạo khu mộ', 'id' => $id]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'id' => 'required|integer|exists:khu_mos,id',
            ...$this->rules(false),
        ]);
        $khuMo = DB::table('khu_mos')->where('id', $data['id'])->first();

        if (!$khuMo || !AccessControl::canManageFamily($request->user(), $khuMo->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        $update = [
            'ten_khu_mo' => $data['ten_khu_mo'],
            'dia_chi' => $data['dia_chi'] ?? null,
            'vi_do' => $data['vi_do'],
            'kinh_do' => $data['kinh_do'],
            'mo_ta' => $data['mo_ta'] ?? null,
            'nguoi_cap_nhat_id' => $this->nguoiDungId($request->user()),
            'updated_at' => now(),
        ];

        if ($request->hasFile('anh_khu_mo')) {
            $photo = $this->storePhoto($request, $khuMo->dong_ho_id);
            $update['anh_khu_mo_path'] = $photo['path'];
            $update['anh_khu_mo_disk'] = $photo['disk'];
            $this->deletePhoto($khuMo);
        }

        DB::table('khu_mos')->where('id', $data['id'])->update($update);

        return response()->json(['success' => true, 'message' => 'Đã cập nhật khu mộ']);
    }

    public function destroy(Request $request)
    {
        $data = $request->validate(['id' => 'required|integer|exists:khu_mos,id']);
        $khuMo = DB::table('khu_mos')->where('id', $data['id'])->first();

        if (!$khuMo || !AccessControl::canManageFamily($request->user(), $khuMo->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        DB::table('khu_mos')->where('id', $data['id'])->delete();
        $this->deletePhoto($khuMo);

        return response()->json(['success' => true, 'message' => 'Đã xóa khu mộ']);
    }

    public function direction(Request $request)
    {
        $data = $request->validate([
            'origin' => ['required', 'string', 'regex:/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/'],
            'destination' => ['required', 'string', 'regex:/^-?\d+(\.\d+)?,-?\d+(\.\d+)?(?:;-?\d+(\.\d+)?,-?\d+(\.\d+)?)*$/'],
            'vehicle' => 'nullable|in:car,bike,motor,taxi,truck,walking',
            'alternatives' => 'nullable|in:true,false,1,0',
            'admin_v2' => 'nullable|in:true,false,1,0',
        ]);

        $apiKey = config('services.openmap.api_key');
        if (!$apiKey) {
            return response()->json(['success' => false, 'message' => 'Chưa cấu hình OPENMAP_API_KEY'], 422);
        }

        $response = Http::timeout(12)->get(rtrim(config('services.openmap.base_url'), '/') . '/direction', [
            'origin' => $data['origin'],
            'destination' => $data['destination'],
            'vehicle' => $data['vehicle'] ?? 'car',
            'alternatives' => $request->boolean('alternatives') ? 'true' : 'false',
            'admin_v2' => $request->boolean('admin_v2') ? 'true' : 'false',
            'apikey' => $apiKey,
        ]);

        if (!$response->successful()) {
            $providerMessage = $response->json('message') ?: $response->body();
            $message = $response->status() === 403
                ? 'OPENMAP_API_KEY chưa có quyền dùng Direction API. Vui lòng bật dịch vụ Routing/Direction trong OpenMap.vn.'
                : 'Không thể lấy chỉ đường OpenMap.vn';

            return response()->json([
                'success' => false,
                'message' => $message,
                'provider_status' => $response->status(),
                'provider_message' => $providerMessage,
            ], 502);
        }

        return response()->json(['success' => true, 'data' => $response->json()]);
    }

    private function baseQuery()
    {
        return DB::table('khu_mos')
            ->leftJoin('nguoi_dungs as nguoi_cap_nhat', 'khu_mos.nguoi_cap_nhat_id', '=', 'nguoi_cap_nhat.id')
            ->leftJoin('mo_phans', 'khu_mos.id', '=', 'mo_phans.khu_mo_id')
            ->groupBy(
                'khu_mos.id',
                'khu_mos.dong_ho_id',
                'khu_mos.ten_khu_mo',
                'khu_mos.dia_chi',
                'khu_mos.vi_do',
                'khu_mos.kinh_do',
                'khu_mos.mo_ta',
                'khu_mos.anh_khu_mo_path',
                'khu_mos.anh_khu_mo_disk',
                'khu_mos.nguoi_cap_nhat_id',
                'khu_mos.created_at',
                'khu_mos.updated_at',
                'nguoi_cap_nhat.ho_ten'
            )
            ->select(
                'khu_mos.*',
                DB::raw("CASE WHEN khu_mos.anh_khu_mo_path IS NULL THEN NULL ELSE CONCAT('/storage/', khu_mos.anh_khu_mo_path) END as anh_khu_mo_url"),
                DB::raw('COUNT(mo_phans.id) as so_mo_phan'),
                'nguoi_cap_nhat.ho_ten as ten_nguoi_cap_nhat'
            );
    }

    private function rules(bool $creating = true): array
    {
        return [
            'dong_ho_id' => ($creating ? 'required' : 'sometimes') . '|integer|exists:dong_hos,id',
            'ten_khu_mo' => 'required|string|max:255',
            'dia_chi' => 'nullable|string|max:255',
            'vi_do' => 'required|numeric|between:-90,90',
            'kinh_do' => 'required|numeric|between:-180,180',
            'mo_ta' => 'nullable|string|max:2000',
            'anh_khu_mo' => 'nullable|image|max:10240',
        ];
    }

    private function storePhoto(Request $request, int|string $familyId): ?array
    {
        if (!$request->hasFile('anh_khu_mo')) {
            return null;
        }

        $disk = 'public';
        $path = $request->file('anh_khu_mo')->store('khu-mo/' . $familyId, $disk);

        return ['disk' => $disk, 'path' => $path];
    }

    private function deletePhoto(object $khuMo): void
    {
        if (empty($khuMo->anh_khu_mo_disk) || empty($khuMo->anh_khu_mo_path)) {
            return;
        }

        Storage::disk($khuMo->anh_khu_mo_disk)->delete($khuMo->anh_khu_mo_path);
    }

    private function nguoiDungId(?Authenticatable $user): ?int
    {
        return $user instanceof NguoiDung ? (int) $user->id : null;
    }
}
