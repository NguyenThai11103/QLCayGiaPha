<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\GoogleLoginRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\GoogleVerifyOtpRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Models\NguoiDung;
use App\Mail\WelcomeEmail;
use App\Mail\ResetPasswordEmail;
use App\Mail\GoogleLoginOtpEmail;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function publicClans()
    {
        $clans = \App\Models\DongHo::where('trang_thai', true)
            ->select('id', 'ten_dong_ho', 'dia_chi_tu_duong')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $clans,
        ]);
    }

    public function register(RegisterRequest $request)
    {
        $data = $request->validated();

        return DB::transaction(function () use ($data) {
            $dongHoId = null;
            $quyenHan = 'thanh_vien';
            $trangThaiGiaNhap = 'da_duyet';

            if (!empty($data['new_clan_name'])) {
                $dongHo = \App\Models\DongHo::create([
                    'ten_dong_ho'      => $data['new_clan_name'],
                    'dia_chi_tu_duong' => $data['new_clan_address'] ?? null,
                    'trang_thai'       => false,
                ]);

                $dongHoId = $dongHo->id;
                $quyenHan = 'quan_ly';
                $trangThaiGiaNhap = 'da_duyet';
            } elseif (!empty($data['dong_ho_id'])) {
                $dongHoId = $data['dong_ho_id'];
                $hasUsers = NguoiDung::where('dong_ho_id', $dongHoId)->exists();
                if (!$hasUsers) {
                    $quyenHan = 'quan_ly';
                    $trangThaiGiaNhap = 'da_duyet';
                } else {
                    $quyenHan = 'thanh_vien';
                    $trangThaiGiaNhap = 'cho_duyet';
                }
            }

            $user = NguoiDung::create([
                'ho_ten'              => $data['ho_ten'],
                'email'               => $data['email'],
                'password'            => Hash::make($data['password']),
                'dong_ho_id'          => $dongHoId,
                'quyen_han'           => $quyenHan,
                'trang_thai_gia_nhap' => $trangThaiGiaNhap,
            ]);

            if ($quyenHan === 'quan_ly' && $dongHoId) {
                $thanhVien = \App\Models\ThanhVien::create([
                    'dong_ho_id'      => $dongHoId,
                    'ho_ten'          => $user->ho_ten,
                    'gioi_tinh'       => 'nam',
                    'doi_thu'         => 1,
                    'thu_tu_sinh'     => 1,
                    'tinh_trang_song' => 1,
                ]);

                $user->update(['thanh_vien_id' => $thanhVien->id]);

                $clan = \App\Models\DongHo::find($dongHoId);
                if ($clan && !$clan->thuy_to_id) {
                    $clan->update(['thuy_to_id' => $thanhVien->id]);
                }
            }

            if (!empty($data['new_clan_name']) && isset($dongHo)) {
                $dongHo->update(['nguoi_tao' => $user->id]);

                $admins = \App\Models\Admin::where('trang_thai', true)->get();
                foreach ($admins as $admin) {
                    try {
                        Mail::to($admin->email)->send(new \App\Mail\ClanRequestMail(
                            $dongHo->ten_dong_ho,
                            $dongHo->dia_chi_tu_duong ?? '',
                            $user->ho_ten,
                            $user->email
                        ));
                    } catch (\Exception $e) {
                        logger()->error('Lỗi gửi mail yêu cầu tạo dòng họ: ' . $e->getMessage());
                    }
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Tao tai khoan thanh cong',
                'data'    => [
                    'id'    => $user->id,
                    'email' => $user->email,
                ],
            ], 201);
        });
    }

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

        // Kiểm tra xem tài khoản có bị khóa không
        if (isset($user->trang_thai) && ($user->trang_thai === 0 || $user->trang_thai === '0' || $user->trang_thai === false)) {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản của bạn đã bị khóa bởi quản trị viên.'
            ], 403);
        }

        // Kiểm tra xem dòng họ có bị khóa hoặc chưa được phê duyệt không
        if ($user->dong_ho_id) {
            $dongHo = \App\Models\DongHo::find($user->dong_ho_id);
            if ($dongHo && !$dongHo->trang_thai) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dòng họ của bạn chưa được phê duyệt hoặc đang bị khóa.'
                ], 403);
            }
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
            // Trả về trực tiếp trang callback của frontend với mock code một cách động
            $url = url('/auth/google/callback?code=mock_authorization_code');
        } else {
            $url = Socialite::driver('google')
                ->redirectUrl(config('services.google.redirect'))
                ->stateless()
                ->redirect()
                ->getTargetUrl();
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
            // Giả lập thông tin người dùng Google động từ email truyền lên hoặc email mặc định
            $mockEmail = $data['email'] ?? 'nguyenvanky20005@gmail.com';
            // Tách phần tên từ email để làm ho_ten giả lập
            $namePart = explode('@', $mockEmail)[0];
            $mockName = ucwords(str_replace(['.', '_', '-'], ' ', $namePart));

            $googleUser = new class($mockEmail, $mockName) {
                private $email;
                private $name;

                public function __construct($email, $name)
                {
                    $this->email = $email;
                    $this->name  = $name;
                }

                public function getId() { return 'mock_google_id_' . md5($this->email); }
                public function getName() { return $this->name; }
                public function getEmail() { return $this->email; }
                public function getAvatar() { return 'https://lh3.googleusercontent.com/a/default-user-avatar=s96-c'; }
            };
        } else {
            try {
                // Socialite driver google stateless exchange token from code
                $googleUser = Socialite::driver('google')
                    ->redirectUrl(config('services.google.redirect'))
                    ->stateless()
                    ->user();
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

        // Kiểm tra xem tài khoản có bị khóa không
        if (isset($user->trang_thai) && ($user->trang_thai === 0 || $user->trang_thai === '0' || $user->trang_thai === false)) {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản của bạn đã bị khóa bởi quản trị viên.'
            ], 403);
        }

        // Kiểm tra xem dòng họ có bị khóa hoặc chưa được phê duyệt không
        if ($user->dong_ho_id) {
            $dongHo = \App\Models\DongHo::find($user->dong_ho_id);
            if ($dongHo && !$dongHo->trang_thai) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dòng họ của bạn chưa được phê duyệt hoặc đang bị khóa.'
                ], 403);
            }
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

    public function googleResendOtp(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'exists:nguoi_dungs,email'],
        ], [
            'email.required' => 'Vui lòng nhập địa chỉ email.',
            'email.email'    => 'Địa chỉ email không đúng định dạng.',
            'email.exists'   => 'Email tài khoản không tồn tại trên hệ thống.',
        ]);

        $otpCode = (string) rand(100000, 999999);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $data['email']],
            [
                'token'      => Hash::make($otpCode),
                'created_at' => now(),
            ]
        );

        try {
            Mail::to($data['email'])->send(new GoogleLoginOtpEmail($otpCode));
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể gửi lại mã OTP xác nhận. Vui lòng thử lại sau.',
            ], 500);
        }

        return response()->json([
            'success'  => true,
            'need_otp' => true,
            'email'    => $data['email'],
            'message'  => 'Mã OTP mới đã được gửi về email của bạn.',
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
        $user = $request->user();
        if ($user && method_exists($user, 'dongHo')) {
            $user->load('dongHo');
        }
        return response()->json([
            'success' => true,
            'data'    => $user,
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

    public function updateProfile(UpdateProfileRequest $request)
    {
        $data = $request->validated();
        $user = $request->user();

        DB::beginTransaction();
        try {
            // Cập nhật thông tin trên tài khoản người dùng
            $avatarUrl = array_key_exists('anh_dai_dien', $data)
                ? ($data['anh_dai_dien'] ?: null)
                : $user->avatar;

            if ($request->hasFile('anh_dai_dien_file')) {
                $this->deleteLocalProfileAvatar($user->avatar);
                $avatarUrl = $this->storeProfileAvatar($request, $user->id);
            }

            $user->update([
                'ho_ten' => $data['ho_ten'],
                'avatar' => $avatarUrl,
            ]);

            // Nếu tài khoản đã liên kết với một thành viên trong gia phả
            if ($user->thanh_vien_id) {
                $thanhVien = \App\Models\ThanhVien::find($user->thanh_vien_id);
                if ($thanhVien) {
                    $thanhVien->update([
                        'ho_ten'       => $data['ho_ten'],
                        'anh_dai_dien' => $avatarUrl,
                        'tieu_su'      => $data['tieu_su'] ?? null,
                    ]);
                }
            }

            DB::commit();

            // Refresh user model to get latest data with accessors
            $user->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật hồ sơ cá nhân thành công',
                'data'    => $user,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi cập nhật hồ sơ: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function changePassword(ChangePasswordRequest $request)
    {
        $data = $request->validated();
        $user = $request->user();

        if (!Hash::check($data['current_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Mật khẩu hiện tại không chính xác.',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($data['new_password']),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại nếu cần.',
        ]);
    }

    private function storeProfileAvatar(UpdateProfileRequest $request, int $userId): string
    {
        $path = $request->file('anh_dai_dien_file')->store('anh-dai-dien/' . $userId, 'public');

        return '/storage/' . $path;
    }

    private function deleteLocalProfileAvatar(?string $avatar): void
    {
        if (!$avatar || !Str::startsWith($avatar, '/storage/anh-dai-dien/')) {
            return;
        }

        Storage::disk('public')->delete(Str::after($avatar, '/storage/'));
    }
}
