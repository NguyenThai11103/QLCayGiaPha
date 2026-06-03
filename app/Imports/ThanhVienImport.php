<?php

namespace App\Imports;

use App\Support\MaThanhVienHelper;
use Carbon\Carbon;
use DateTimeInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use Throwable;

class ThanhVienImport implements ToCollection, WithHeadingRow
{
    private array $summary = [
        'rows' => 0,
        'created' => 0,
        'updated' => 0,
        'relations_created' => 0,
        'relations_skipped' => 0,
        'errors' => [],
    ];

    private array $pendingRelations = [];
    private array $membersByCode = [];

    public function __construct(private readonly int $dongHoId)
    {
    }

    public function collection(Collection $rows): void
    {
        $this->membersByCode = $this->loadMembersByCode();

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;
            $data = $row->toArray();

            if ($this->isEmptyRow($data)) {
                continue;
            }

            $this->summary['rows']++;

            try {
                $memberId = $this->upsertMember($data, $rowNumber);
                $this->pendingRelations[] = [
                    'row' => $rowNumber,
                    'member_id' => $memberId,
                    'ma_cha' => $this->cell($data, 'ma_cha'),
                    'ma_me' => $this->cell($data, 'ma_me'),
                    'ma_vo_chong' => $this->cell($data, 'ma_vo_chong'),
                ];
            } catch (Throwable $exception) {
                $this->addError($rowNumber, $exception->getMessage());
            }
        }

        $this->membersByCode = $this->loadMembersByCode();

        foreach ($this->pendingRelations as $relationRow) {
            $this->syncRelations($relationRow);
        }
    }

    public function summary(): array
    {
        return $this->summary;
    }

    private function upsertMember(array $row, int $rowNumber): int
    {
        $name = $this->stringOrNull($this->cell($row, 'ho_ten'));
        if (!$name) {
            throw new InvalidArgumentException('Thieu cot ho_ten.');
        }

        $code = $this->normalizeCode($this->cell($row, 'ma_thanh_vien'));
        if (!$code) {
            $code = MaThanhVienHelper::generate($this->dongHoId);
        }

        $existingByCode = DB::table('thanh_viens')->where('ma_thanh_vien', $code)->first();
        if ($existingByCode && (int) $existingByCode->dong_ho_id !== $this->dongHoId) {
            throw new InvalidArgumentException("Ma thanh vien {$code} da ton tai o dong ho khac.");
        }

        $data = [
            'dong_ho_id' => $this->dongHoId,
            'ma_thanh_vien' => $code,
            'ho_ten' => $name,
            'ten_thuong_goi' => $this->stringOrNull($this->cell($row, 'ten_thuong_goi')),
            'gioi_tinh' => $this->normalizeGender($this->cell($row, 'gioi_tinh'), $rowNumber),
            'thu_tu_sinh' => $this->nullableInt($this->cell($row, 'thu_tu_sinh')),
            'doi_thu' => $this->nullableInt($this->cell($row, 'doi_thu')),
            'tinh_trang_song' => $this->normalizeLivingStatus($this->cell($row, 'tinh_trang_song')),
            'ngay_sinh_duong' => $this->nullableDate($this->cell($row, 'ngay_sinh_duong'), $rowNumber, 'ngay_sinh_duong'),
            'ngay_sinh_am' => $this->nullableDate($this->cell($row, 'ngay_sinh_am'), $rowNumber, 'ngay_sinh_am'),
            'nam_sinh_uoc_tinh' => $this->nullableInt($this->cell($row, 'nam_sinh_uoc_tinh')),
            'ngay_mat_am' => $this->nullableDate($this->cell($row, 'ngay_mat_am'), $rowNumber, 'ngay_mat_am'),
            'nghe_nghiep' => $this->stringOrNull($this->cell($row, 'nghe_nghiep')),
            'dia_chi' => $this->stringOrNull($this->cell($row, 'dia_chi')),
            'cho_o_hien_tai' => $this->stringOrNull($this->cell($row, 'cho_o_hien_tai')),
            'tieu_su' => $this->stringOrNull($this->cell($row, 'tieu_su')),
            'updated_at' => now(),
        ];

        if ($existingByCode) {
            DB::table('thanh_viens')
                ->where('id', $existingByCode->id)
                ->update($data);

            $this->summary['updated']++;

            return (int) $existingByCode->id;
        }

        $data['created_at'] = now();
        $memberId = DB::table('thanh_viens')->insertGetId($data);
        $this->summary['created']++;

        return (int) $memberId;
    }

    private function syncRelations(array $relationRow): void
    {
        $childId = (int) $relationRow['member_id'];
        $rowNumber = (int) $relationRow['row'];

        $this->syncParentRelation($childId, $relationRow['ma_cha'], 'cha_con', $rowNumber, 'ma_cha');
        $this->syncParentRelation($childId, $relationRow['ma_me'], 'me_con', $rowNumber, 'ma_me');

        foreach ($this->splitCodes($relationRow['ma_vo_chong']) as $spouseCode) {
            $spouse = $this->membersByCode[$spouseCode] ?? null;

            if (!$spouse) {
                $this->skipRelation($rowNumber, "Khong tim thay ma_vo_chong {$spouseCode} trong dong ho.");
                continue;
            }

            $spouseId = (int) $spouse->id;
            if ($spouseId === $childId) {
                $this->skipRelation($rowNumber, 'Thanh vien khong the la vo/chong cua chinh minh.');
                continue;
            }

            $node1 = min($childId, $spouseId);
            $node2 = max($childId, $spouseId);
            $exists = DB::table('quan_hes')
                ->where('node_1_id', $node1)
                ->where('node_2_id', $node2)
                ->where('loai_quan_he', 'vo_chong')
                ->exists();

            if ($exists) {
                continue;
            }

            DB::table('quan_hes')->insert([
                'node_1_id' => $node1,
                'node_2_id' => $node2,
                'loai_quan_he' => 'vo_chong',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->summary['relations_created']++;
        }
    }

    private function syncParentRelation(int $childId, mixed $parentCodeValue, string $type, int $rowNumber, string $column): void
    {
        $parentCode = $this->normalizeCode($parentCodeValue);
        if (!$parentCode) {
            return;
        }

        $parent = $this->membersByCode[$parentCode] ?? null;
        if (!$parent) {
            $this->skipRelation($rowNumber, "Khong tim thay {$column} {$parentCode} trong dong ho.");
            return;
        }

        $parentId = (int) $parent->id;
        if ($parentId === $childId) {
            $this->skipRelation($rowNumber, 'Thanh vien khong the la cha/me cua chinh minh.');
            return;
        }

        $existing = DB::table('quan_hes')
            ->where('node_2_id', $childId)
            ->where('loai_quan_he', $type)
            ->first();

        if ($existing && (int) $existing->node_1_id === $parentId) {
            return;
        }

        if ($existing) {
            DB::table('quan_hes')->where('id', $existing->id)->delete();
        }

        DB::table('quan_hes')->insert([
            'node_1_id' => $parentId,
            'node_2_id' => $childId,
            'loai_quan_he' => $type,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->summary['relations_created']++;
    }

    private function loadMembersByCode(): array
    {
        return DB::table('thanh_viens')
            ->where('dong_ho_id', $this->dongHoId)
            ->whereNotNull('ma_thanh_vien')
            ->get()
            ->mapWithKeys(fn ($member) => [$this->normalizeCode($member->ma_thanh_vien) => $member])
            ->all();
    }

    private function isEmptyRow(array $row): bool
    {
        foreach ($row as $value) {
            if ($this->stringOrNull($value) !== null) {
                return false;
            }
        }

        return true;
    }

    private function splitCodes(mixed $value): array
    {
        $text = $this->stringOrNull($value);
        if (!$text) {
            return [];
        }

        $parts = preg_split('/[,;|\r\n]+/', $text) ?: [];

        return array_values(array_unique(array_filter(array_map(
            fn ($code) => $this->normalizeCode($code),
            $parts,
        ))));
    }

    private function cell(array $row, string $key): mixed
    {
        return $row[$key] ?? null;
    }

    private function stringOrNull(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if ($value instanceof DateTimeInterface) {
            return Carbon::instance($value)->toDateString();
        }

        $text = trim((string) $value);

        return $text === '' ? null : $text;
    }

    private function nullableInt(mixed $value): ?int
    {
        $text = $this->stringOrNull($value);
        if ($text === null) {
            return null;
        }

        return (int) $text;
    }

    private function nullableDate(mixed $value, int $rowNumber, string $column): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($value instanceof DateTimeInterface) {
            return Carbon::instance($value)->toDateString();
        }

        if (is_numeric($value)) {
            try {
                return ExcelDate::excelToDateTimeObject((float) $value)->format('Y-m-d');
            } catch (Throwable) {
                throw new InvalidArgumentException("Cot {$column} o dong {$rowNumber} khong dung dinh dang ngay.");
            }
        }

        $text = trim((string) $value);
        if ($text === '') {
            return null;
        }

        foreach (['Y-m-d', 'd/m/Y', 'd-m-Y', 'Y/m/d'] as $format) {
            try {
                $date = Carbon::createFromFormat($format, $text);
                if ($date) {
                    return $date->toDateString();
                }
            } catch (Throwable) {
            }
        }

        try {
            return Carbon::parse($text)->toDateString();
        } catch (Throwable) {
            throw new InvalidArgumentException("Cot {$column} o dong {$rowNumber} khong dung dinh dang ngay.");
        }
    }

    private function normalizeCode(mixed $value): string
    {
        $text = $this->stringOrNull($value);
        if (!$text) {
            return '';
        }

        return Str::upper($text);
    }

    private function normalizeGender(mixed $value, int $rowNumber): string
    {
        $text = $this->normalizePlainText($value);
        if ($text === '') {
            return 'nam';
        }

        if (in_array($text, ['nam', 'male', 'm'], true)) {
            return 'nam';
        }

        if (in_array($text, ['nu', 'female', 'f'], true)) {
            return 'nu';
        }

        throw new InvalidArgumentException("Cot gioi_tinh o dong {$rowNumber} chi nhan nam hoac nu.");
    }

    private function normalizeLivingStatus(mixed $value): int
    {
        $text = $this->normalizePlainText($value);
        if ($text === '') {
            return 1;
        }

        if (in_array($text, ['0', 'da_mat', 'mat', 'dead', 'false', 'khong'], true)) {
            return 0;
        }

        return 1;
    }

    private function normalizePlainText(mixed $value): string
    {
        $text = $this->stringOrNull($value);
        if (!$text) {
            return '';
        }

        return Str::of($text)
            ->ascii()
            ->lower()
            ->replace([' ', '-'], '_')
            ->toString();
    }

    private function skipRelation(int $rowNumber, string $message): void
    {
        $this->summary['relations_skipped']++;
        $this->addError($rowNumber, $message);
    }

    private function addError(int $rowNumber, string $message): void
    {
        $this->summary['errors'][] = [
            'row' => $rowNumber,
            'message' => $message,
        ];
    }
}
