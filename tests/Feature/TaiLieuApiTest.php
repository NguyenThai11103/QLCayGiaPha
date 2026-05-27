<?php

use App\Models\NguoiDung;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

function createTaiLieuTestDongHo(string $name): int
{
    return DB::table('dong_hos')->insertGetId([
        'ten_dong_ho' => $name,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

function createTaiLieuTestUser(int $dongHoId, string $role = 'quan_ly'): NguoiDung
{
    return NguoiDung::create([
        'dong_ho_id' => $dongHoId,
        'ho_ten' => "Tai Lieu {$role}",
        'email' => "{$role}_" . uniqid() . '@tailieu.test',
        'password' => Hash::make('password'),
        'quyen_han' => $role,
    ]);
}

function createTaiLieuTestMember(int $dongHoId, string $name): int
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

it('allows a family manager to upload a document file', function () {
    Storage::fake('public');

    $familyId = createTaiLieuTestDongHo('Ho Tai Lieu');
    $memberId = createTaiLieuTestMember($familyId, 'Nguoi Co Anh');
    $user = createTaiLieuTestUser($familyId);

    Sanctum::actingAs($user);

    $response = $this->postJson('/api/tai-lieu/create', [
        'dong_ho_id' => $familyId,
        'thanh_vien_id' => $memberId,
        'ten_tai_lieu' => 'Anh tu lieu',
        'mo_ta' => 'Anh scan cu',
        'file' => UploadedFile::fake()->image('anh-tu-lieu.jpg'),
    ]);

    $response->assertOk()
        ->assertJsonPath('success', true);

    $document = DB::table('tai_lieus')->where('id', $response->json('id'))->first();

    expect($document->dong_ho_id)->toBe($familyId)
        ->and($document->thanh_vien_id)->toBe($memberId)
        ->and($document->ten_tai_lieu)->toBe('Anh tu lieu')
        ->and($document->ten_file_goc)->toBe('anh-tu-lieu.jpg')
        ->and($document->disk)->toBe('public')
        ->and($document->nguoi_tai_len_id)->toBe($user->id);

    Storage::disk('public')->assertExists($document->path);
});

it('prevents a manager from attaching a document to another family member', function () {
    Storage::fake('public');

    $familyA = createTaiLieuTestDongHo('Ho A Tai Lieu');
    $familyB = createTaiLieuTestDongHo('Ho B Tai Lieu');
    $memberB = createTaiLieuTestMember($familyB, 'Nguoi Ho B');

    Sanctum::actingAs(createTaiLieuTestUser($familyA));

    $this->postJson('/api/tai-lieu/create', [
        'dong_ho_id' => $familyA,
        'thanh_vien_id' => $memberB,
        'file' => UploadedFile::fake()->create('gia-pha.pdf', 128, 'application/pdf'),
    ])->assertUnprocessable();
});

it('deletes the stored file when a document is deleted', function () {
    Storage::fake('public');

    $familyId = createTaiLieuTestDongHo('Ho Xoa Tai Lieu');
    $user = createTaiLieuTestUser($familyId);

    Sanctum::actingAs($user);

    $create = $this->postJson('/api/tai-lieu/create', [
        'dong_ho_id' => $familyId,
        'file' => UploadedFile::fake()->create('toc-uoc.pdf', 128, 'application/pdf'),
    ]);

    $document = DB::table('tai_lieus')->where('id', $create->json('id'))->first();
    Storage::disk('public')->assertExists($document->path);

    $this->postJson('/api/tai-lieu/delete', [
        'id' => $document->id,
    ])->assertOk();

    Storage::disk('public')->assertMissing($document->path);
    $this->assertDatabaseMissing('tai_lieus', ['id' => $document->id]);
});
