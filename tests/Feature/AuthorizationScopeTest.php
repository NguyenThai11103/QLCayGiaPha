<?php

use App\Models\NguoiDung;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

function createScopeTestDongHo(string $name): int
{
    return DB::table('dong_hos')->insertGetId([
        'ten_dong_ho' => $name,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

function createScopeTestUser(int|null $dongHoId, string $role): NguoiDung
{
    return NguoiDung::create([
        'dong_ho_id' => $dongHoId,
        'ho_ten' => "Test {$role}",
        'email' => "{$role}_" . uniqid() . '@test.local',
        'password' => Hash::make('password'),
        'quyen_han' => $role,
    ]);
}

function createScopeTestThanhVien(int $dongHoId, string $name): int
{
    return DB::table('thanh_viens')->insertGetId([
        'dong_ho_id' => $dongHoId,
        'ho_ten' => $name,
        'gioi_tinh' => 'nam',
        'tinh_trang_song' => 1,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

it('requires authentication for protected family APIs', function () {
    $this->getJson('/api/nguoi/list')->assertUnauthorized();
});

it('prevents a family manager from reading another family scope', function () {
    $familyA = createScopeTestDongHo('Family A');
    $familyB = createScopeTestDongHo('Family B');
    createScopeTestThanhVien($familyA, 'Nguoi A');
    createScopeTestThanhVien($familyB, 'Nguoi B');

    Sanctum::actingAs(createScopeTestUser($familyA, 'quan_ly'));

    $this->getJson("/api/nguoi/list?id_dong_ho={$familyB}")->assertForbidden();

    $response = $this->getJson('/api/nguoi/list')
        ->assertOk()
        ->assertJsonPath('success', true);

    expect($response->json('data'))->toHaveCount(1)
        ->and($response->json('data.0.ten_day_du'))->toBe('Nguoi A');
});

it('prevents normal members from writing family data', function () {
    $familyId = createScopeTestDongHo('Family Member');

    Sanctum::actingAs(createScopeTestUser($familyId, 'thanh_vien'));

    $this->postJson('/api/nguoi/create', [
        'id_dong_ho' => $familyId,
        'ten_day_du' => 'Thanh vien moi',
        'gioi_tinh' => 'nam',
        'da_mat' => false,
    ])->assertForbidden();
});

it('allows system admin to read all family scopes', function () {
    $familyA = createScopeTestDongHo('Family A');
    $familyB = createScopeTestDongHo('Family B');
    createScopeTestThanhVien($familyA, 'Nguoi A');
    createScopeTestThanhVien($familyB, 'Nguoi B');

    Sanctum::actingAs(createScopeTestUser(null, 'admin'));

    $response = $this->getJson('/api/nguoi/list')
        ->assertOk()
        ->assertJsonPath('success', true);

    expect($response->json('data'))->toHaveCount(2);
});
