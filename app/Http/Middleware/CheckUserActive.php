<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckUserActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user) {
            // Kiểm tra xem tài khoản người dùng có bị khóa hay không
            if (isset($user->trang_thai) && ($user->trang_thai === 0 || $user->trang_thai === '0' || $user->trang_thai === false)) {
                // Đăng xuất và xóa token
                try {
                    if ($request->user()->currentAccessToken()) {
                        $request->user()->currentAccessToken()->delete();
                    }
                } catch (\Exception $e) {}
                
                Auth::guard('web')->logout();

                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Tài khoản của bạn đã bị khóa bởi quản trị viên.'
                    ], 403);
                }

                return redirect('/login')->withErrors(['email' => 'Tài khoản của bạn đã bị khóa bởi quản trị viên.']);
            }

            // Kiểm tra xem dòng họ có bị khóa hoặc chưa được phê duyệt không
            if ($user->dong_ho_id) {
                $dongHo = \App\Models\DongHo::find($user->dong_ho_id);
                if ($dongHo && !$dongHo->trang_thai) {
                    try {
                        if ($request->user()->currentAccessToken()) {
                            $request->user()->currentAccessToken()->delete();
                        }
                    } catch (\Exception $e) {}
                    
                    Auth::guard('web')->logout();

                    if ($request->expectsJson() || $request->is('api/*')) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Dòng họ của bạn chưa được phê duyệt hoặc đang bị khóa.'
                        ], 403);
                    }

                    return redirect('/login')->withErrors(['email' => 'Dòng họ của bạn chưa được phê duyệt hoặc đang bị khóa.']);
                }
            }

            // Kiểm tra xem tài khoản có đang ở trạng thái chờ duyệt hay không
            if (($user->trang_thai_gia_nhap ?? 'da_duyet') === 'cho_duyet') {
                $allowedPaths = [
                    'onboarding',
                    'api/onboarding',
                    'auth/me',
                    'api/auth/me',
                    'auth/logout',
                    'api/auth/logout',
                    'loi-moi',
                    'api/invitations',
                    'login',
                    'logout'
                ];

                $isAllowed = false;
                foreach ($allowedPaths as $path) {
                    if ($request->is($path) || $request->is($path . '/*')) {
                        $isAllowed = true;
                        break;
                    }
                }

                if (!$isAllowed) {
                    if ($request->expectsJson() || $request->is('api/*')) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Tài khoản của bạn đang ở trạng thái chờ duyệt gia nhập dòng họ.'
                        ], 403);
                    }

                    return redirect('/onboarding');
                }
            }
        }

        return $next($request);
    }
}
