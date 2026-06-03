<?php

namespace App\Http\Controllers\Api;

use App\Exports\ThanhVienExport;
use App\Exports\ThanhVienTemplateExport;
use App\Http\Controllers\Controller;
use App\Imports\ThanhVienImport;
use App\Support\AccessControl;
use App\Support\MaThanhVienHelper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

class ThanhVienExcelController extends Controller
{
    public function export(Request $request): JsonResponse|BinaryFileResponse
    {
        [$familyId, $error] = $this->resolveFamilyId($request, false);
        if ($error) {
            return $error;
        }

        $this->ensureMemberCodes($familyId);

        return Excel::download(
            new ThanhVienExport($familyId),
            $this->fileName($familyId, 'thanh-vien')
        );
    }

    public function template(Request $request): JsonResponse|BinaryFileResponse
    {
        [$familyId, $error] = $this->resolveFamilyId($request, true);
        if ($error) {
            return $error;
        }

        return Excel::download(
            new ThanhVienTemplateExport(),
            $this->fileName($familyId, 'mau-import-thanh-vien')
        );
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'dong_ho_id' => ['nullable', 'integer', 'exists:dong_hos,id'],
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
        ]);

        [$familyId, $error] = $this->resolveFamilyId($request, true);
        if ($error) {
            return $error;
        }

        $this->ensureMemberCodes($familyId);
        $import = new ThanhVienImport($familyId);

        try {
            DB::transaction(function () use ($import, $request) {
                Excel::import($import, $request->file('file'));
            });
        } catch (Throwable $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Khong the import file Excel. Vui long kiem tra lai dinh dang file.',
            ], 422);
        }

        $summary = $import->summary();
        $errorCount = count($summary['errors']);

        return response()->json([
            'success' => true,
            'message' => $errorCount > 0
                ? "Da import xong, co {$errorCount} dong can kiem tra."
                : 'Import thanh vien thanh cong.',
            'data' => $summary,
        ]);
    }

    private function resolveFamilyId(Request $request, bool $mustManage): array
    {
        $familyId = $request->input('dong_ho_id', $request->query('dong_ho_id'));
        $familyId = $familyId ? (int) $familyId : AccessControl::familyId($request->user());

        if (!$familyId) {
            return [null, response()->json([
                'success' => false,
                'message' => 'Vui long chon dong ho can thao tac.',
            ], 422)];
        }

        $allowed = $mustManage
            ? AccessControl::canManageFamily($request->user(), $familyId)
            : AccessControl::canAccessFamily($request->user(), $familyId);

        if (!$allowed) {
            return [null, AccessControl::forbidden()];
        }

        return [$familyId, null];
    }

    private function ensureMemberCodes(int $familyId): void
    {
        $memberIds = DB::table('thanh_viens')
            ->where('dong_ho_id', $familyId)
            ->where(function ($query) {
                $query->whereNull('ma_thanh_vien')
                    ->orWhere('ma_thanh_vien', '');
            })
            ->orderBy('id')
            ->pluck('id');

        foreach ($memberIds as $memberId) {
            DB::table('thanh_viens')
                ->where('id', $memberId)
                ->update([
                    'ma_thanh_vien' => MaThanhVienHelper::generate($familyId),
                    'updated_at' => now(),
                ]);
        }
    }

    private function fileName(int $familyId, string $prefix): string
    {
        $familyName = DB::table('dong_hos')->where('id', $familyId)->value('ten_dong_ho') ?: 'dong-ho';

        return $prefix . '-' . Str::slug($familyName) . '-' . now()->format('Ymd-His') . '.xlsx';
    }
}
