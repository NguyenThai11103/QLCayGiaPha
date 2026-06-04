<?php

use App\Models\NguoiDung;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

function createAlbumTestDongHo(string $name): int
{
    return DB::table('dong_hos')->insertGetId([
        'ten_dong_ho' => $name,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

function createAlbumTestUser(int $dongHoId, string $role = 'quan_ly'): NguoiDung
{
    return NguoiDung::create([
        'dong_ho_id' => $dongHoId,
        'ho_ten' => "Album {$role}",
        'email' => "{$role}_" . uniqid() . '@album.test',
        'password' => Hash::make('password'),
        'quyen_han' => $role,
    ]);
}

it('allows a family manager to create an album', function () {
    $familyId = createAlbumTestDongHo('Ho Album');
    $user = createAlbumTestUser($familyId, 'quan_ly');

    Sanctum::actingAs($user);

    $response = $this->postJson('/api/album-anh/create', [
        'dong_ho_id' => $familyId,
        'ten_album' => 'Giỗ Tổ 2026',
        'loai_album' => 'gioi_to',
        'nam' => 2026,
        'mo_ta' => 'Album giỗ tổ năm 2026',
    ]);

    $response->assertOk()
        ->assertJsonPath('success', true);

    $this->assertDatabaseHas('album_anhs', [
        'id' => $response->json('data.id'),
        'ten_album' => 'Giỗ Tổ 2026',
        'nam' => 2026,
        'nguoi_tao_id' => $user->id,
    ]);
});

it('allows a manager to upload photos and then delete one photo', function () {
    Storage::fake('public');

    $familyId = createAlbumTestDongHo('Ho Upload');
    $user = createAlbumTestUser($familyId, 'quan_ly');
    
    // Create an album first
    $albumId = DB::table('album_anhs')->insertGetId([
        'dong_ho_id' => $familyId,
        'ten_album' => 'Album Upload Test',
        'loai_album' => 'tu_lieu',
        'nam' => 2026,
        'nguoi_tao_id' => $user->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    Sanctum::actingAs($user);

    // Upload 2 photos
    $response = $this->postJson('/api/album-anh/upload-anh', [
        'album_id' => $albumId,
        'files' => [
            UploadedFile::fake()->image('photo1.jpg'),
            UploadedFile::fake()->image('photo2.jpg'),
        ],
        'captions' => [
            'Ảnh 1',
            'Ảnh 2',
        ],
    ]);

    $response->assertOk()
        ->assertJsonPath('success', true);

    $this->assertDatabaseCount('anh_albums', 2);
    
    $photo = DB::table('anh_albums')->where('album_id', $albumId)->first();
    Storage::disk('public')->assertExists($photo->path);

    // Delete one photo
    $deleteResponse = $this->postJson('/api/album-anh/delete-anh', [
        'id' => $photo->id,
    ]);

    $deleteResponse->assertOk()
        ->assertJsonPath('success', true);

    Storage::disk('public')->assertMissing($photo->path);
    $this->assertDatabaseMissing('anh_albums', ['id' => $photo->id]);
});

it('deletes all photo files when an album is deleted', function () {
    Storage::fake('public');

    $familyId = createAlbumTestDongHo('Ho Delete Album');
    $user = createAlbumTestUser($familyId, 'quan_ly');

    $albumId = DB::table('album_anhs')->insertGetId([
        'dong_ho_id' => $familyId,
        'ten_album' => 'Album Deletion Test',
        'loai_album' => 'tu_lieu',
        'nam' => 2026,
        'nguoi_tao_id' => $user->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    Sanctum::actingAs($user);

    // Upload a photo
    $this->postJson('/api/album-anh/upload-anh', [
        'album_id' => $albumId,
        'files' => [UploadedFile::fake()->image('photo.jpg')],
        'captions' => ['Nice photo'],
    ])->assertOk();

    $photo = DB::table('anh_albums')->where('album_id', $albumId)->first();
    Storage::disk('public')->assertExists($photo->path);

    // Delete album
    $this->postJson('/api/album-anh/delete', [
        'id' => $albumId,
    ])->assertOk();

    $this->assertDatabaseMissing('album_anhs', ['id' => $albumId]);
    $this->assertDatabaseMissing('anh_albums', ['id' => $photo->id]);
    Storage::disk('public')->assertMissing($photo->path);
});
