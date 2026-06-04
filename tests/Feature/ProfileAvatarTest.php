<?php

use App\Models\NguoiDung;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

function makeProfileUser(): NguoiDung
{
    return NguoiDung::create([
        'ho_ten' => 'Nguyen Van A',
        'email' => 'profile@example.com',
        'password' => Hash::make('password123'),
        'quyen_han' => 'thanh_vien',
    ]);
}

test('profile update saves avatar url on account', function () {
    $user = makeProfileUser();
    Sanctum::actingAs($user);

    $response = $this->postJson('/api/auth/profile', [
        'ho_ten' => 'Nguyen Van A Updated',
        'anh_dai_dien' => 'https://example.com/avatar.jpg',
        'tieu_su' => 'Thong tin ngan',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'anh_dai_dien' => 'https://example.com/avatar.jpg',
            ],
        ]);

    $user->refresh();

    $this->assertSame('https://example.com/avatar.jpg', $user->avatar);
});

test('profile update uploads avatar file and returns public url', function () {
    Storage::fake('public');

    $user = makeProfileUser();
    Sanctum::actingAs($user);

    $response = $this->post('/api/auth/profile', [
        'ho_ten' => 'Nguyen Van A Updated',
        'anh_dai_dien_file' => UploadedFile::fake()->image('avatar.jpg', 120, 120),
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
        ]);

    $user->refresh();

    $this->assertNotNull($user->avatar);
    $this->assertStringStartsWith('/storage/anh-dai-dien/' . $user->id . '/', $user->avatar);
    $this->assertSame($user->avatar, $response->json('data.anh_dai_dien'));

    Storage::disk('public')->assertExists(Str::after($user->avatar, '/storage/'));
});
