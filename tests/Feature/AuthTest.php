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
            'ho_ten' => 'Người Dùng Test',
            'quyen_han' => 'quan_ly'
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

        // Xoá bộ nhớ đệm xác thực của ứng dụng trong môi trường test
        app('auth')->forgetGuards();

        // Cố gắng gọi lại /auth/me với token đã bị xoá
        $meResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
                           ->getJson('/api/auth/me');
                           
        // Phải trả về 401
        $meResponse->assertStatus(401);
    }

    public function test_pending_user_is_blocked_from_general_apis()
    {
        $dongHo = \App\Models\DongHo::create([
            'ten_dong_ho' => 'Dòng Họ Test',
            'trang_thai' => true
        ]);

        $user = NguoiDung::create([
            'email' => 'pending@example.com',
            'password' => Hash::make('password123'),
            'ho_ten' => 'Người Dùng Chờ Duyệt',
            'quyen_han' => 'thanh_vien',
            'trang_thai_gia_nhap' => 'cho_duyet',
            'dong_ho_id' => $dongHo->id
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                         ->getJson('/api/nguoi/list');

        $response->assertStatus(403)
                 ->assertJson([
                     'success' => false,
                     'message' => 'Tài khoản của bạn đang ở trạng thái chờ duyệt gia nhập dòng họ.'
                 ]);
    }

    public function test_pending_user_can_access_onboarding_and_profile_apis()
    {
        $dongHo = \App\Models\DongHo::create([
            'ten_dong_ho' => 'Dòng Họ Test 2',
            'trang_thai' => true
        ]);

        $user = NguoiDung::create([
            'email' => 'pending2@example.com',
            'password' => Hash::make('password123'),
            'ho_ten' => 'Người Dùng Chờ Duyệt 2',
            'quyen_han' => 'thanh_vien',
            'trang_thai_gia_nhap' => 'cho_duyet',
            'dong_ho_id' => $dongHo->id
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        // Thử truy cập API /auth/me
        $meResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
                           ->getJson('/api/auth/me');
        $meResponse->assertStatus(200);

        // Thử truy cập API /onboarding/search-clan
        $onboardingResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
                                    ->getJson('/api/onboarding/search-clan?keyword=Test');
        $onboardingResponse->assertStatus(200);
    }

    public function test_deleting_member_locks_linked_user_account_and_cleans_up_relations()
    {
        $dongHo = \App\Models\DongHo::create([
            'ten_dong_ho' => 'Dòng Họ Test Delete',
            'trang_thai' => true
        ]);

        $manager = NguoiDung::create([
            'email' => 'manager_delete@example.com',
            'password' => Hash::make('password123'),
            'ho_ten' => 'Trưởng tộc',
            'quyen_han' => 'quan_ly',
            'dong_ho_id' => $dongHo->id
        ]);

        $member = \App\Models\ThanhVien::create([
            'dong_ho_id' => $dongHo->id,
            'ho_ten' => 'Thành Viên Xóa',
            'gioi_tinh' => 'nam'
        ]);

        $linkedUser = NguoiDung::create([
            'email' => 'linked_user@example.com',
            'password' => Hash::make('password123'),
            'ho_ten' => 'Thành Viên Xóa',
            'quyen_han' => 'thanh_vien',
            'dong_ho_id' => $dongHo->id,
            'thanh_vien_id' => $member->id,
            'trang_thai_gia_nhap' => 'da_duyet',
            'trang_thai' => 1
        ]);

        $member2 = \App\Models\ThanhVien::create([
            'dong_ho_id' => $dongHo->id,
            'ho_ten' => 'Thành Viên 2',
            'gioi_tinh' => 'nu'
        ]);

        // Tạo quan hệ liên quan
        \Illuminate\Support\Facades\DB::table('quan_hes')->insert([
            'node_1_id' => $member->id,
            'node_2_id' => $member2->id,
            'loai_quan_he' => 'vo_chong',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $token = $manager->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                         ->postJson('/api/nguoi/delete', [
                             'id' => $member->id
                         ]);

        $response->assertStatus(200);

        // Kiểm tra xem thành viên đã bị xóa khỏi bảng thanh_viens chưa
        $this->assertDatabaseMissing('thanh_viens', [
            'id' => $member->id
        ]);

        // Kiểm tra xem quan hệ đã bị xóa chưa
        $this->assertDatabaseMissing('quan_hes', [
            'node_1_id' => $member->id
        ]);

        // Kiểm tra xem tài khoản người dùng liên kết đã bị khóa chưa
        $linkedUser->refresh();
        $this->assertEquals(0, $linkedUser->trang_thai);
        $this->assertNull($linkedUser->thanh_vien_id);
        $this->assertNull($linkedUser->dong_ho_id);
        $this->assertEquals('tu_choi', $linkedUser->trang_thai_gia_nhap);
    }
}
