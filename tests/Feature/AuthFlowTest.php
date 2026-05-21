<?php

use App\Models\NguoiDung;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Mail\ResetPasswordEmail;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

test('forgot password requires a valid and existing email', function () {
    $response = $this->postJson('/api/auth/forgot-password', [
        'email' => 'nonexistent@example.com'
    ]);

    $response->assertStatus(422)
             ->assertJsonValidationErrors(['email']);
});

test('forgot password generates token and sends email for valid user', function () {
    Mail::fake();

    $user = NguoiDung::create([
        'ho_ten'    => 'Test User',
        'email'     => 'test@example.com',
        'password'  => Hash::make('password123'),
        'quyen_han' => 'thanh_vien'
    ]);

    $response = $this->postJson('/api/auth/forgot-password', [
        'email' => 'test@example.com'
    ]);

    $response->assertStatus(200)
             ->assertJson([
                 'success' => true,
                 'message' => 'Liên kết khôi phục mật khẩu đã được gửi qua email của bạn.'
             ]);

    $this->assertDatabaseHas('password_reset_tokens', [
        'email' => 'test@example.com'
    ]);

    Mail::assertSent(ResetPasswordEmail::class, function ($mail) use ($user) {
        return $mail->hasTo($user->email);
    });
});

test('reset password validates fields', function () {
    $response = $this->postJson('/api/auth/reset-password', [
        'email'           => '',
        'token'           => '',
        'password'        => '123',
        'confirmPassword' => '1234'
    ]);

    $response->assertStatus(422)
             ->assertJsonValidationErrors(['email', 'token', 'password', 'confirmPassword']);
});

test('reset password works with valid token', function () {
    $user = NguoiDung::create([
        'ho_ten'    => 'Test User',
        'email'     => 'test@example.com',
        'password'  => Hash::make('old_password'),
        'quyen_han' => 'thanh_vien'
    ]);

    $rawToken = Str::random(64);

    DB::table('password_reset_tokens')->insert([
        'email'      => 'test@example.com',
        'token'      => Hash::make($rawToken),
        'created_at' => now()
    ]);

    $response = $this->postJson('/api/auth/reset-password', [
        'email'           => 'test@example.com',
        'token'           => $rawToken,
        'password'        => 'new_password123',
        'confirmPassword' => 'new_password123'
    ]);

    $response->assertStatus(200)
             ->assertJson([
                 'success' => true,
                 'message' => 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại với mật khẩu mới.'
             ]);

    // Check password updated
    $user->refresh();
    $this->assertTrue(Hash::check('new_password123', $user->password));

    // Check token deleted
    $this->assertDatabaseMissing('password_reset_tokens', [
        'email' => 'test@example.com'
    ]);
});
