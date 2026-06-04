<?php

use App\Models\NguoiDung;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

function createNhatKyTestDongHo(string $name): int
{
    return DB::table('dong_hos')->insertGetId([
        'ten_dong_ho' => $name,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

function createNhatKyTestUser(int $dongHoId, string $role = 'quan_ly'): NguoiDung
{
    return NguoiDung::create([
        'dong_ho_id' => $dongHoId,
        'ho_ten' => "Nhat Ky {$role}",
        'email' => "{$role}_" . uniqid() . '@nhatky.test',
        'password' => Hash::make('password'),
        'quyen_han' => $role,
    ]);
}

it('automatically writes a log when creating, updating, and deleting a member', function () {
    $familyId = createNhatKyTestDongHo('Ho Luu Log');
    $user = createNhatKyTestUser($familyId, 'quan_ly');

    Sanctum::actingAs($user);

    // 1. Test Create Member
    $createResponse = $this->postJson('/api/nguoi/create', [
        'id_dong_ho' => $familyId,
        'ten_day_du' => 'Nguyễn Bá A',
        'gioi_tinh' => 'nam',
        'ngay_sinh' => '1990-01-01',
        'da_mat' => false,
        'thu_tu_sinh' => 1,
    ]);

    $createResponse->assertOk()
        ->assertJsonPath('success', true);
        
    $memberId = $createResponse->json('id');

    $this->assertDatabaseHas('nhat_ky_gia_phas', [
        'dong_ho_id' => $familyId,
        'thanh_vien_id' => $memberId,
        'hanh_dong' => 'create',
        'nguoi_thuc_hien_id' => $user->id,
    ]);

    // 2. Test Update Member
    $updateResponse = $this->postJson('/api/nguoi/update', [
        'id' => $memberId,
        'id_dong_ho' => $familyId,
        'ten_day_du' => 'Nguyễn Bá A Sửa',
        'gioi_tinh' => 'nam',
        'ngay_sinh' => '1990-01-01',
        'da_mat' => false,
        'thu_tu_sinh' => 1,
    ]);

    $updateResponse->assertOk()
        ->assertJsonPath('success', true);

    $this->assertDatabaseHas('nhat_ky_gia_phas', [
        'dong_ho_id' => $familyId,
        'thanh_vien_id' => $memberId,
        'hanh_dong' => 'update',
        'nguoi_thuc_hien_id' => $user->id,
    ]);

    // 3. Test Delete Member
    $deleteResponse = $this->postJson('/api/nguoi/delete', [
        'id' => $memberId,
    ]);

    $deleteResponse->assertOk()
        ->assertJsonPath('success', true);

    $this->assertDatabaseHas('nhat_ky_gia_phas', [
        'dong_ho_id' => $familyId,
        'thanh_vien_id' => null, // thanh_vien_id becomes null since foreign key is onDelete set null or nullable
        'hanh_dong' => 'delete',
        'nguoi_thuc_hien_id' => $user->id,
    ]);
});

it('can restore an updated family tree member', function () {
    $familyId = createNhatKyTestDongHo('Ho Restore Member');
    $user = createNhatKyTestUser($familyId, 'quan_ly');

    Sanctum::actingAs($user);

    // Create member
    $createRes = $this->postJson('/api/nguoi/create', [
        'id_dong_ho' => $familyId,
        'ten_day_du' => 'Thành Viên Gốc',
        'gioi_tinh' => 'nam',
        'ngay_sinh' => '1980-05-05',
        'da_mat' => false,
        'thu_tu_sinh' => 2,
    ]);
    
    $memberId = $createRes->json('id');

    // Update member details
    $this->postJson('/api/nguoi/update', [
        'id' => $memberId,
        'id_dong_ho' => $familyId,
        'ten_day_du' => 'Thành Viên Bị Sửa',
        'gioi_tinh' => 'nam',
        'ngay_sinh' => '1980-05-05',
        'da_mat' => false,
        'thu_tu_sinh' => 2,
    ])->assertOk();

    // Verify database has updated name
    $this->assertDatabaseHas('thanh_viens', [
        'id' => $memberId,
        'ho_ten' => 'Thành Viên Bị Sửa',
    ]);

    // Find the update log
    $log = DB::table('nhat_ky_gia_phas')
        ->where('dong_ho_id', $familyId)
        ->where('hanh_dong', 'update')
        ->first();

    // Call restore API
    $restoreResponse = $this->postJson('/api/nhat-ky-gia-pha/restore', [
        'id' => $log->id,
    ]);

    $restoreResponse->assertOk()
        ->assertJsonPath('success', true);

    // Verify member has reverted to the original name
    $this->assertDatabaseHas('thanh_viens', [
        'id' => $memberId,
        'ho_ten' => 'Thành Viên Gốc',
    ]);
});
