<?php

namespace Tests\Feature;

use App\Models\NguoiDung;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Tạo một user mẫu để test
        NguoiDung::create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
            'ho_va_ten' => 'Người Dùng Test',
            'is_master' => 1
        ]);
    }

    public function test_login_success_returns_token()
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password123'
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'data' => [
                         'user',
                         'token'
                     ]
                 ]);
        
        $this->assertTrue($response->json('success'));
    }

    public function test_login_fail_returns_401()
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'wrongpassword'
        ]);

        $response->assertStatus(401)
                 ->assertJson([
                     'success' => false,
                     'message' => 'Email hoặc mật khẩu không chính xác'
                 ]);
    }

    public function test_get_me_with_valid_token()
    {
        // Login trước để lấy token
        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password123'
        ]);
        
        $token = $loginResponse->json('data.token');

        // Gọi API /auth/me kèm token
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                         ->getJson('/api/auth/me');

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true
                 ]);
                 
        $this->assertEquals('test@example.com', $response->json('data.email'));
    }

    public function test_get_me_without_token_fails()
    {
        $response = $this->getJson('/api/auth/me');
        $response->assertStatus(401);
    }

    public function test_logout_invalidates_token()
    {
        // Login trước
        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password123'
        ]);
        
        $token = $loginResponse->json('data.token');

        // Gọi API logout
        $logoutResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
                               ->postJson('/api/auth/logout');
                               
        $logoutResponse->assertStatus(200)
                       ->assertJson([
                           'success' => true,
                           'message' => 'Đăng xuất thành công'
                       ]);

        // Cố gắng gọi lại /auth/me với token đã bị xoá
        $meResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
                           ->getJson('/api/auth/me');
                           
        // Phải trả về 401
        $meResponse->assertStatus(401);
    }
}
