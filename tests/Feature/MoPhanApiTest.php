<?php

use App\Models\NguoiDung;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

function createMoPhanTestDongHo(string $name): int
{
    return DB::table('dong_hos')->insertGetId([
        'ten_dong_ho' => $name,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

function createMoPhanTestUser(int $dongHoId, string $role = 'thanh_vien'): NguoiDung
{
    return NguoiDung::create([
        'dong_ho_id' => $dongHoId,
        'ho_ten' => "Mo Phan {$role}",
        'email' => "{$role}_" . uniqid() . '@mophan.test',
        'password' => Hash::make('password'),
        'quyen_han' => $role,
    ]);
}

function createMoPhanTestThanhVien(int $dongHoId, string $name, bool $daMat = true): int
{
    return DB::table('thanh_viens')->insertGetId([
        'dong_ho_id' => $dongHoId,
        'ho_ten' => $name,
        'gioi_tinh' => 'nam',
        'tinh_trang_song' => $daMat ? 0 : 1,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

function createMoPhanTestRecord(int $dongHoId, int $thanhVienId, ?int $nguoiCapNhatId = null): int
{
    return DB::table('mo_phans')->insertGetId([
        'dong_ho_id' => $dongHoId,
        'thanh_vien_id' => $thanhVienId,
        'vi_do' => 10.1234567,
        'kinh_do' => 106.1234567,
        'ghi_chu' => 'Canh cay dua to',
        'nguoi_cap_nhat_id' => $nguoiCapNhatId,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

it('requires authentication for grave location APIs', function () {
    $this->getJson('/api/mo-phan/list')->assertUnauthorized();
});

it('allows an approved family member to create a grave location for a deceased member', function () {
    $familyId = createMoPhanTestDongHo('Ho GPS');
    $memberId = createMoPhanTestThanhVien($familyId, 'Ong To');
    $user = createMoPhanTestUser($familyId);

    Sanctum::actingAs($user);

    $response = $this->postJson('/api/mo-phan/create', [
        'thanh_vien_id' => $memberId,
        'vi_do' => 10.762622,
        'kinh_do' => 106.660172,
        'ghi_chu' => 'Nam canh cay dua to',
    ]);

    $response->assertOk()
        ->assertJsonPath('success', true);

    $this->assertDatabaseHas('mo_phans', [
        'dong_ho_id' => $familyId,
        'thanh_vien_id' => $memberId,
        'nguoi_cap_nhat_id' => $user->id,
        'ghi_chu' => 'Nam canh cay dua to',
    ]);
});

it('rejects grave location for a living member', function () {
    $familyId = createMoPhanTestDongHo('Ho Con Song');
    $memberId = createMoPhanTestThanhVien($familyId, 'Nguoi Con Song', false);
    $user = createMoPhanTestUser($familyId);

    Sanctum::actingAs($user);

    $this->postJson('/api/mo-phan/create', [
        'thanh_vien_id' => $memberId,
        'vi_do' => 10.762622,
        'kinh_do' => 106.660172,
    ])->assertStatus(422);
});

it('prevents a member from saving a grave location in another family', function () {
    $familyA = createMoPhanTestDongHo('Ho A');
    $familyB = createMoPhanTestDongHo('Ho B');
    $memberB = createMoPhanTestThanhVien($familyB, 'Nguoi Ho B');
    $userA = createMoPhanTestUser($familyA);

    Sanctum::actingAs($userA);

    $this->postJson('/api/mo-phan/create', [
        'thanh_vien_id' => $memberB,
        'vi_do' => 10.762622,
        'kinh_do' => 106.660172,
    ])->assertForbidden();
});

it('prevents duplicate grave locations for the same member', function () {
    $familyId = createMoPhanTestDongHo('Ho Trung Mo');
    $memberId = createMoPhanTestThanhVien($familyId, 'Nguoi Da Co Mo');
    $user = createMoPhanTestUser($familyId);
    createMoPhanTestRecord($familyId, $memberId, $user->id);

    Sanctum::actingAs($user);

    $this->postJson('/api/mo-phan/create', [
        'thanh_vien_id' => $memberId,
        'vi_do' => 11.111111,
        'kinh_do' => 107.111111,
    ])->assertStatus(409);
});

it('prevents a pending family member from saving a grave location', function () {
    $familyId = createMoPhanTestDongHo('Ho Cho Duyet');
    $memberId = createMoPhanTestThanhVien($familyId, 'Nguoi Chua Duoc Luu Mo');
    $user = createMoPhanTestUser($familyId);

    DB::table('nguoi_dungs')->where('id', $user->id)->update([
        'trang_thai_gia_nhap' => 'cho_duyet',
    ]);

    $user->refresh();
    Sanctum::actingAs($user);

    $this->postJson('/api/mo-phan/create', [
        'thanh_vien_id' => $memberId,
        'vi_do' => 10.762622,
        'kinh_do' => 106.660172,
    ])->assertForbidden();
});

it('allows an approved family member to update a grave location in their family', function () {
    $familyId = createMoPhanTestDongHo('Ho Cap Nhat');
    $memberId = createMoPhanTestThanhVien($familyId, 'Nguoi Can Cap Nhat');
    $user = createMoPhanTestUser($familyId);
    $graveId = createMoPhanTestRecord($familyId, $memberId);

    Sanctum::actingAs($user);

    $this->postJson('/api/mo-phan/update', [
        'id' => $graveId,
        'vi_do' => 12.345678,
        'kinh_do' => 108.345678,
        'ghi_chu' => 'Gan bia da mau den',
    ])->assertOk()
        ->assertJsonPath('success', true);

    $this->assertDatabaseHas('mo_phans', [
        'id' => $graveId,
        'nguoi_cap_nhat_id' => $user->id,
        'ghi_chu' => 'Gan bia da mau den',
    ]);
});

it('rejects null coordinates when updating a grave location', function () {
    $familyId = createMoPhanTestDongHo('Ho Toa Do Null');
    $memberId = createMoPhanTestThanhVien($familyId, 'Nguoi Co Toa Do');
    $user = createMoPhanTestUser($familyId);
    $graveId = createMoPhanTestRecord($familyId, $memberId);

    Sanctum::actingAs($user);

    $this->postJson('/api/mo-phan/update', [
        'id' => $graveId,
        'vi_do' => null,
    ])->assertUnprocessable();

    $this->assertDatabaseHas('mo_phans', [
        'id' => $graveId,
        'vi_do' => 10.1234567,
    ]);
});

it('prevents reading another family grave scope', function () {
    $familyA = createMoPhanTestDongHo('Ho Doc A');
    $familyB = createMoPhanTestDongHo('Ho Doc B');
    $memberB = createMoPhanTestThanhVien($familyB, 'Nguoi Ho B');
    createMoPhanTestRecord($familyB, $memberB);

    Sanctum::actingAs(createMoPhanTestUser($familyA));

    $this->getJson("/api/mo-phan/list?dong_ho_id={$familyB}")->assertForbidden();
});

it('allows only a family manager to delete a grave location', function () {
    $familyId = createMoPhanTestDongHo('Ho Xoa Mo');
    $memberId = createMoPhanTestThanhVien($familyId, 'Nguoi Co Mo');
    $graveId = createMoPhanTestRecord($familyId, $memberId);

    Sanctum::actingAs(createMoPhanTestUser($familyId));

    $this->postJson('/api/mo-phan/delete', [
        'id' => $graveId,
    ])->assertForbidden();

    Sanctum::actingAs(createMoPhanTestUser($familyId, 'quan_ly'));

    $this->postJson('/api/mo-phan/delete', [
        'id' => $graveId,
    ])->assertOk()
        ->assertJsonPath('success', true);

    $this->assertDatabaseMissing('mo_phans', [
        'id' => $graveId,
    ]);
});

it('prevents a pending family manager from deleting a grave location', function () {
    $familyId = createMoPhanTestDongHo('Ho Quan Ly Cho Duyet');
    $memberId = createMoPhanTestThanhVien($familyId, 'Nguoi Co Mo Chua Xoa');
    $graveId = createMoPhanTestRecord($familyId, $memberId);
    $manager = createMoPhanTestUser($familyId, 'quan_ly');

    DB::table('nguoi_dungs')->where('id', $manager->id)->update([
        'trang_thai_gia_nhap' => 'cho_duyet',
    ]);

    $manager->refresh();
    Sanctum::actingAs($manager);

    $this->postJson('/api/mo-phan/delete', [
        'id' => $graveId,
    ])->assertForbidden();

    $this->assertDatabaseHas('mo_phans', [
        'id' => $graveId,
    ]);
});
