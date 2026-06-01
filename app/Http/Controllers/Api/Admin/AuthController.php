<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Auth\LoginRequest;
use App\Http\Requests\Admin\Auth\UpdateProfileRequest;
use App\Http\Requests\Admin\Auth\ChangePasswordRequest;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        $data = $request->validated();

        $admin = Admin::where('email', $data['email'])->first();

        if (!$admin || !Hash::check($data['password'], $admin->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email hoặc mật khẩu không chính xác'
            ], 401);
        }

        if (!$admin->trang_thai) {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản của bạn đã bị khóa.'
            ], 403);
        }

        $token = $admin->createToken('admin_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập thành công',
            'data'    => [
                'user'  => $admin,
                'token' => $token
            ]
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'data'    => $request->user(),
        ]);
    }

    public function updateProfile(UpdateProfileRequest $request)
    {
        $data = $request->validated();
        $admin = $request->user();

        $admin->update([
            'ho_ten' => $data['ho_ten'],
            'email'  => $data['email'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật hồ sơ cá nhân thành công',
            'data'    => $admin,
        ]);
    }

    public function changePassword(ChangePasswordRequest $request)
    {
        $data = $request->validated();
        $admin = $request->user();

        if (!Hash::check($data['current_password'], $admin->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Mật khẩu hiện tại không chính xác.',
            ], 422);
        }

        $admin->update([
            'password' => Hash::make($data['new_password']),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đổi mật khẩu thành công.',
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
