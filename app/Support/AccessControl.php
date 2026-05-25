<?php

namespace App\Support;

use App\Models\Admin;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AccessControl
{
    public static function isSystemAdmin(?Authenticatable $user): bool
    {
        if (!$user) {
            return false;
        }

        if ($user instanceof Admin) {
            return true;
        }

        return false;
    }

    public static function isFamilyManager(?Authenticatable $user): bool
    {
        if (self::isSystemAdmin($user)) {
            return true;
        }

        return ($user->quyen_han ?? null) === 'quan_ly';
    }

    public static function familyId(?Authenticatable $user): ?int
    {
        $familyId = $user->dong_ho_id ?? null;

        return $familyId ? (int) $familyId : null;
    }

    public static function canAccessFamily(?Authenticatable $user, int|string|null $familyId): bool
    {
        if (!$familyId) {
            return self::isSystemAdmin($user);
        }

        if (self::isSystemAdmin($user)) {
            return true;
        }

        return self::familyId($user) === (int) $familyId;
    }

    public static function canManageFamily(?Authenticatable $user, int|string|null $familyId): bool
    {
        return self::isFamilyManager($user) && self::canAccessFamily($user, $familyId);
    }

    public static function scopeFamilyQuery(Builder $query, ?Authenticatable $user, string $column = 'dong_ho_id'): Builder
    {
        if (self::isSystemAdmin($user)) {
            return $query;
        }

        $familyId = self::familyId($user);

        return $familyId
            ? $query->where($column, $familyId)
            : $query->whereRaw('1 = 0');
    }

    public static function memberFamilyId(int|string|null $memberId): ?int
    {
        if (!$memberId) {
            return null;
        }

        $familyId = DB::table('thanh_viens')->where('id', $memberId)->value('dong_ho_id');

        return $familyId ? (int) $familyId : null;
    }

    public static function allMembersInFamily(array $memberIds, int|string $familyId): bool
    {
        $memberIds = array_values(array_unique(array_filter($memberIds)));

        if (empty($memberIds)) {
            return true;
        }

        $count = DB::table('thanh_viens')
            ->whereIn('id', $memberIds)
            ->where('dong_ho_id', $familyId)
            ->count();

        return $count === count($memberIds);
    }

    public static function relationFamilyId(int|string|null $relationId): ?int
    {
        if (!$relationId) {
            return null;
        }

        $relation = DB::table('quan_hes')->where('id', $relationId)->first();

        if (!$relation) {
            return null;
        }

        return self::sharedMembersFamilyId([$relation->node_1_id, $relation->node_2_id]);
    }

    public static function sharedMembersFamilyId(array $memberIds): ?int
    {
        $memberIds = array_values(array_unique(array_filter($memberIds)));

        if (empty($memberIds)) {
            return null;
        }

        $familyIds = DB::table('thanh_viens')
            ->whereIn('id', $memberIds)
            ->pluck('dong_ho_id')
            ->unique()
            ->values();

        return $familyIds->count() === 1 ? (int) $familyIds->first() : null;
    }

    public static function documentFamilyId(object $document): ?int
    {
        if (!empty($document->dong_ho_id)) {
            return (int) $document->dong_ho_id;
        }

        return self::memberFamilyId($document->thanh_vien_id ?? null);
    }

    public static function forbidden(string $message = 'Ban khong co quyen thuc hien thao tac nay.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 403);
    }

    public static function invalidScope(string $message = 'Du lieu khong thuoc pham vi dong ho duoc phep.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 422);
    }
}
