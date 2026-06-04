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

        $data = $query->orderBy('khu_mos.ten_khu_mo')->get()
            ->map(fn ($khuMo) => $this->attachPhotoUrls($khuMo));

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules());

        if (!AccessControl::canManageFamily($request->user(), $data['dong_ho_id'])) {
            return AccessControl::forbidden();
        }

        $photos = $this->storePhotos($request, $data['dong_ho_id']);
        $primaryPhoto = $photos[0] ?? null;
        $id = DB::table('khu_mos')->insertGetId([
            'dong_ho_id' => $data['dong_ho_id'],
            'ten_khu_mo' => $data['ten_khu_mo'],
            'dia_chi' => $data['dia_chi'] ?? null,
            'vi_do' => $data['vi_do'],
            'kinh_do' => $data['kinh_do'],
            'mo_ta' => $data['mo_ta'] ?? null,
            'anh_khu_mo_path' => $primaryPhoto['path'] ?? null,
            'anh_khu_mo_disk' => $primaryPhoto['disk'] ?? null,
            'anh_khu_mo_paths' => !empty($photos) ? json_encode(array_column($photos, 'path')) : null,
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
            $photos = $this->storePhotos($request, $khuMo->dong_ho_id);
            $existingPaths = $this->photoPaths($khuMo);
            $newPaths = array_column($photos, 'path');
            $allPaths = array_values(array_unique([...$existingPaths, ...$newPaths]));
            $primaryPath = $allPaths[0] ?? null;

            $update['anh_khu_mo_path'] = $primaryPath;
            $update['anh_khu_mo_disk'] = $primaryPath ? 'public' : null;
            $update['anh_khu_mo_paths'] = !empty($allPaths) ? json_encode($allPaths) : null;
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
        $this->deletePhotos($khuMo);

        return response()->json(['success' => true, 'message' => 'Đã xóa khu mộ']);
    }

    public function direction(Request $request)
    {
        $data = $request->validate([
            'origin'       => ['required', 'string', 'regex:/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/'],
            'destination'  => ['required', 'string', 'regex:/^-?\d+(\.\d+)?,-?\d+(\.\d+)?(?:;-?\d+(\.\d+)?,-?\d+(\.\d+)?)*$/'],
            'vehicle'      => 'nullable|in:car,bike,motor,taxi,truck,walking',
            'alternatives' => 'nullable|in:true,false,1,0',
            'admin_v2'     => 'nullable|in:true,false,1,0',
        ]);

        $vehicle = $data['vehicle'] ?? 'motor';

        // ═══════════════════════════════════════
        // PRIMARY: OpenMap.vn Direction API
        // ═══════════════════════════════════════
        $apiKey = config('services.openmap.api_key');
        if ($apiKey) {
            try {
                $omResponse = Http::timeout(10)->get(
                    rtrim(config('services.openmap.base_url'), '/') . '/direction',
                    [
                        'origin'       => $data['origin'],
                        'destination'  => $data['destination'],
                        'vehicle'      => $vehicle,
                        'alternatives' => $request->boolean('alternatives') ? 'true' : 'false',
                        'admin_v2'     => $request->boolean('admin_v2', false) ? 'true' : 'false',
                        'apikey'       => $apiKey,
                    ]
                );

                if ($omResponse->successful() && $omResponse->json('routes')) {
                    return response()->json([
                        'success'  => true,
                        'data'     => $omResponse->json(),
                        'provider' => 'openmap',
                    ]);
                }
                // Nếu OpenMap fail (403, quota...) → tiếp tục fallback sang OSRM
            } catch (\Exception) {
                // Timeout hoặc lỗi mạng → fallback OSRM
            }
        }

        // ═══════════════════════════════════════
        // FALLBACK: OSRM (Open Source Routing Machine)
        //           Miễn phí, không cần API key
        // ═══════════════════════════════════════
        $vehicleMap = [
            'car'     => 'driving',
            'motor'   => 'driving',
            'taxi'    => 'driving',
            'truck'   => 'driving',
            'bike'    => 'cycling',
            'walking' => 'foot',
        ];
        $profile = $vehicleMap[$vehicle] ?? 'driving';

        // OSRM nhận tọa độ dạng "lng,lat" (đảo ngược so với lat,lng)
        [$originLat, $originLng] = explode(',', $data['origin']);
        [$destLat, $destLng]     = explode(',', $data['destination']);
        $coordinates             = "{$originLng},{$originLat};{$destLng},{$destLat}";

        $osrmUrl  = "https://router.project-osrm.org/route/v1/{$profile}/{$coordinates}";
        $response = Http::timeout(15)->get($osrmUrl, [
            'overview'    => 'full',
            'steps'       => 'true',
            'annotations' => 'false',
            'geometries'  => 'polyline',
        ]);

        if (!$response->successful() || $response->json('code') !== 'Ok') {
            $code    = $response->json('code') ?? 'ERROR';
            $message = $code === 'NoRoute'
                ? 'Không tìm được tuyến đường giữa hai điểm này.'
                : 'Không thể lấy chỉ đường. Vui lòng thử lại.';

            return response()->json([
                'success'          => false,
                'message'          => $message,
                'provider_status'  => $response->status(),
                'provider_message' => $code,
            ], 502);
        }

        $json  = $response->json();
        $route = $json['routes'][0];
        $leg   = $route['legs'][0];

        // Tính khoảng cách & thời gian
        $distanceM   = $route['distance'] ?? 0;
        $durationS   = $route['duration'] ?? 0;
        $distanceKm  = round($distanceM / 1000, 1);
        $durationMin = (int) ceil($durationS / 60);
        $distText    = $distanceKm >= 1 ? "{$distanceKm} km" : "{$distanceM} m";
        $durText     = $durationMin >= 60
            ? floor($durationMin / 60) . ' giờ ' . ($durationMin % 60) . ' phút'
            : "{$durationMin} phút";

        // Normalize OSRM steps về format OpenMap (html_instructions + distance/duration object)
        $steps = [];
        foreach ($leg['steps'] ?? [] as $step) {
            $modifier     = $step['maneuver']['modifier'] ?? null;
            $maneuverType = $step['maneuver']['type'] ?? 'turn';
            $instruction  = $this->buildStepInstruction($maneuverType, $modifier, $step['name'] ?? '');
            $stepDist     = $step['distance'] ?? 0;
            $stepDur      = $step['duration'] ?? 0;
            $steps[] = [
                'html_instructions' => $instruction,
                'distance'          => ['text' => $stepDist >= 1000 ? round($stepDist / 1000, 1) . ' km' : round($stepDist) . ' m', 'value' => $stepDist],
                'duration'          => ['text' => ceil($stepDur / 60) . ' phút', 'value' => $stepDur],
                'maneuver'          => $modifier,
                'location'          => $step['maneuver']['location'] ?? null,
            ];
        }

        // Format giống OpenMap để frontend directionSummary() xử lý chung
        $normalized = [
            'routes' => [[
                'legs' => [[
                    'distance'      => ['text' => $distText, 'value' => $distanceM],
                    'duration'      => ['text' => $durText, 'value' => $durationS],
                    'start_address' => null,
                    'end_address'   => null,
                    'steps'         => $steps,
                ]],
                'overview_polyline' => ['points' => $route['geometry'] ?? null],
            ]],
        ];

        return response()->json([
            'success'  => true,
            'data'     => $normalized,
            'provider' => 'osrm',
        ]);
    }

    private function buildStepInstruction(string $type, ?string $modifier, string $name): string
    {
        $roadName = $name ? " vào {$name}" : '';
        $map = [
            'depart'           => "Bắt đầu xuất phát{$roadName}",
            'arrive'           => 'Đã đến nơi',
            'turn left'        => "Rẽ trái{$roadName}",
            'turn right'       => "Rẽ phải{$roadName}",
            'turn slight left'  => "Nhẹ nhàng rẽ trái{$roadName}",
            'turn slight right' => "Nhẹ nhàng rẽ phải{$roadName}",
            'turn sharp left'  => "Rẽ gấp trái{$roadName}",
            'turn sharp right' => "Rẽ gấp phải{$roadName}",
            'turn uturn'       => "Quay đầu{$roadName}",
            'roundabout left'  => "Vào vòng xuyến, rẽ trái{$roadName}",
            'roundabout right' => "Vào vòng xuyến, rẽ phải{$roadName}",
        ];

        $key = $modifier ? "{$type} {$modifier}" : $type;
        return $map[$key] ?? "Tiếp tục di chuyển{$roadName}";
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
                'khu_mos.anh_khu_mo_paths',
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
            'anh_khu_mo' => 'nullable',
            'anh_khu_mo.*' => 'nullable|image|max:10240',
        ];
    }

    private function storePhotos(Request $request, int|string $familyId): array
    {
        if (!$request->hasFile('anh_khu_mo')) {
            return [];
        }

        $disk = 'public';
        $files = $request->file('anh_khu_mo');
        $files = is_array($files) ? $files : [$files];

        return array_map(
            fn ($file) => ['disk' => $disk, 'path' => $file->store('khu-mo/' . $familyId, $disk)],
            $files,
        );
    }

    private function deletePhotos(object $khuMo): void
    {
        $paths = $this->photoPaths($khuMo);
        if (empty($paths)) {
            return;
        }

        Storage::disk($khuMo->anh_khu_mo_disk ?: 'public')->delete($paths);
    }

    private function photoPaths(object $khuMo): array
    {
        $paths = [];
        if (!empty($khuMo->anh_khu_mo_paths)) {
            $decoded = is_string($khuMo->anh_khu_mo_paths)
                ? json_decode($khuMo->anh_khu_mo_paths, true)
                : $khuMo->anh_khu_mo_paths;

            if (is_array($decoded)) {
                $paths = array_values(array_filter($decoded));
            }
        }

        if (empty($paths) && !empty($khuMo->anh_khu_mo_path)) {
            $paths[] = $khuMo->anh_khu_mo_path;
        }

        return array_values(array_unique($paths));
    }

    private function attachPhotoUrls(object $khuMo): object
    {
        $urls = array_map(
            fn (string $path) => '/storage/' . ltrim($path, '/'),
            $this->photoPaths($khuMo),
        );

        $khuMo->anh_khu_mo_urls = $urls;
        $khuMo->anh_khu_mo_url = $urls[0] ?? $khuMo->anh_khu_mo_url ?? null;

        return $khuMo;
    }

    private function nguoiDungId(?Authenticatable $user): ?int
    {
        return $user instanceof NguoiDung ? (int) $user->id : null;
    }
}
