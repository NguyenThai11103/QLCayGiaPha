<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\GoogleLoginRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\GoogleVerifyOtpRequest;
use App\Models\NguoiDung;
use App\Mail\WelcomeEmail;
use App\Mail\ResetPasswordEmail;
use App\Mail\GoogleLoginOtpEmail;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        $data = $request->validated();

        $user = NguoiDung::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email hoặc mật khẩu không chính xác'
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập thành công',
            'data'    => [
                'user'  => $user,
                'token' => $token
            ]
        ]);
    }

    public function googleUrl()
    {
        if (config('services.google.client_id') === 'mock_client_id_for_testing') {
            // Trả về trực tiếp trang callback của frontend với mock code
            $url = 'http://localhost:5173/auth/google/callback?code=mock_authorization_code';
        } else {
            $url = Socialite::driver('google')->stateless()->redirect()->getTargetUrl();
        }

        return response()->json([
            'success' => true,
            'url'     => $url,
        ]);
    }

    public function googleCallback(GoogleLoginRequest $request)
    {
        $data = $request->validated();
 
        if (config('services.google.client_id') === 'mock_client_id_for_testing' || $data['code'] === 'mock_authorization_code') {
            // Giả lập thông tin người dùng Google của Nguyễn Văn Kỳ để chạy thử không lỗi
            $googleUser = new class {
                public function getId() { return '102938475647382910'; }
                public function getName() { return 'Nguyễn Văn Kỳ'; }
                public function getEmail() { return 'nguyenvanky20005@gmail.com'; }
                public function getAvatar() { return 'https://lh3.googleusercontent.com/a/default-user-avatar=s96-c'; }
            };
        } else {
            try {
                // Socialite driver google stateless exchange token from code
                $googleUser = Socialite::driver('google')->stateless()->user();
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể xác thực thông tin từ Google: ' . $e->getMessage()
                ], 400);
            }
        }
 
        if (!$googleUser || !$googleUser->getEmail()) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy thông tin email từ tài khoản Google.'
            ], 400);
        }
 
        // 1. Tìm hoặc tạo/liên kết tài khoản người dùng ngay lập tức
        $user = NguoiDung::where('google_id', $googleUser->getId())->first();
 
        if (!$user) {
            $user = NguoiDung::where('email', $googleUser->getEmail())->first();
 
            if ($user) {
                $user->update([
                    'google_id' => $googleUser->getId(),
                    'avatar'    => $googleUser->getAvatar(),
                ]);
            } else {
                $user = NguoiDung::create([
                    'ho_ten'    => $googleUser->getName() ?? 'Thành viên mới',
                    'email'     => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'avatar'    => $googleUser->getAvatar(),
                    'password'  => Hash::make(Str::random(16)),
                    'quyen_han' => 'thanh_vien',
                ]);
            }
        } else {
            $user->update([
                'avatar' => $googleUser->getAvatar(),
            ]);
        }
 
        // 2. Sinh mã xác nhận OTP 6 số để gửi qua email yêu cầu xác minh
        $otpCode = (string) rand(100000, 999999);
 
        // Lưu OTP vào bảng tạm password_reset_tokens
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'token'      => Hash::make($otpCode),
                'created_at' => now()
            ]
        );
 
        // 3. Gửi Email OTP Đăng nhập Google thật
        try {
            Mail::to($user->email)->send(new GoogleLoginOtpEmail($otpCode));
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể gửi mã OTP xác nhận về email của bạn. Vui lòng thử lại sau.'
            ], 500);
        }
 
        return response()->json([
            'success'  => true,
            'need_otp' => true,
            'email'    => $user->email,
            'message'  => 'Mã xác minh (OTP) đã được gửi về email của bạn để hoàn tất đăng nhập.'
        ]);
    }
 
    public function googleVerifyOtp(GoogleVerifyOtpRequest $request)
    {
        $data = $request->validated();
        $email = $data['email'];
        $token = $data['token']; // Mã OTP 6 số xác minh đăng nhập Google
 
        $resetRow = DB::table('password_reset_tokens')->where('email', $email)->first();
 
        if (!$resetRow) {
            return response()->json([
                'success' => false,
                'message' => 'Mã xác nhận đăng nhập không hợp lệ hoặc đã hết hạn.'
            ], 400);
        }
 
        // Mã OTP có hiệu lực trong 15 phút
        if (now()->subMinutes(15)->gt($resetRow->created_at)) {
            DB::table('password_reset_tokens')->where('email', $email)->delete();
            return response()->json([
                'success' => false,
                'message' => 'Mã xác nhận (OTP) đã hết hạn. Vui lòng thử đăng nhập lại từ đầu.'
            ], 400);
        }
 
        if (!Hash::check($token, $resetRow->token)) {
            return response()->json([
                'success' => false,
                'message' => 'Mã xác nhận (OTP) nhập vào không chính xác.'
            ], 400);
        }
 
        $user = NguoiDung::where('email', $email)->first();
 
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy tài khoản người dùng.'
            ], 404);
        }
 
        // Tạo Sanctum Token chính thức cho phiên đăng nhập thành công
        $authToken = $user->createToken('auth_token')->plainTextToken;
 
        // Xóa OTP khỏi bảng tạm sau khi đăng nhập thành công
        DB::table('password_reset_tokens')->where('email', $email)->delete();
 
        // Gửi Welcome Email nếu đây là tài khoản mới được tạo gần đây (trong vòng 5 phút)
        if ($user->created_at->gt(now()->subMinutes(5))) {
            try {
                Mail::to($user->email)->send(new WelcomeEmail($user->ho_ten, url('/login')));
            } catch (\Exception $e) {
                logger()->error('Lỗi gửi email chào mừng: ' . $e->getMessage());
            }
        }
 
        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập Google thành công',
            'data'    => [
                'user'  => $user,
                'token' => $authToken
            ]
        ]);
    }

    public function forgotPassword(ForgotPasswordRequest $request)
    {
        $data = $request->validated();
        $email = $data['email'];
 
        // Tạo mã xác nhận OTP gồm 6 chữ số ngẫu nhiên
        $otpCode = (string) rand(100000, 999999);
 
        // Lưu mã OTP đã được mã hóa vào bảng password_reset_tokens
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            [
                'token'      => Hash::make($otpCode),
                'created_at' => now()
            ]
        );
 
        try {
            Mail::to($email)->send(new ResetPasswordEmail($otpCode));
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể gửi mã xác nhận qua email. Vui lòng thử lại sau.'
            ], 500);
        }
 
        return response()->json([
            'success' => true,
            'message' => 'Mã xác nhận (OTP) khôi phục mật khẩu đã được gửi qua email của bạn.'
        ]);
    }
 
    public function resetPassword(ResetPasswordRequest $request)
    {
        $data = $request->validated();
        $email = $data['email'];
        $token = $data['token']; // Đây chính là mã OTP 6 chữ số
        $password = $data['password'];
 
        $resetRow = DB::table('password_reset_tokens')->where('email', $email)->first();
 
        if (!$resetRow) {
            return response()->json([
                'success' => false,
                'message' => 'Mã xác nhận khôi phục mật khẩu không hợp lệ hoặc đã hết hạn.'
            ], 400);
        }
 
        // Kiểm tra thời hạn mã OTP (15 phút)
        if (now()->subMinutes(15)->gt($resetRow->created_at)) {
            DB::table('password_reset_tokens')->where('email', $email)->delete();
            return response()->json([
                'success' => false,
                'message' => 'Mã xác nhận (OTP) đã hết hạn. Vui lòng yêu cầu mã mới.'
            ], 400);
        }
 
        if (!Hash::check($token, $resetRow->token)) {
            return response()->json([
                'success' => false,
                'message' => 'Mã xác nhận (OTP) nhập vào không chính xác.'
            ], 400);
        }
 
        $user = NguoiDung::where('email', $email)->first();
        if ($user) {
            $user->update([
                'password' => Hash::make($password)
            ]);
        }
 
        // Xóa mã OTP khỏi DB sau khi đặt lại mật khẩu thành công
        DB::table('password_reset_tokens')->where('email', $email)->delete();
 
        return response()->json([
            'success' => true,
            'message' => 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại với mật khẩu mới.'
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'data'    => $request->user(),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đăng xuất thành công',
        ]);
    }
}
