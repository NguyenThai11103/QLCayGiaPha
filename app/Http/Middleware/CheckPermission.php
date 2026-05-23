<?php

namespace App\Http\Middleware;

use App\Support\AccessControl;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        foreach ($roles as $role) {
            if ($role === 'system_admin' && AccessControl::isSystemAdmin($user)) {
                return $next($request);
            }

            if ($role === 'quan_ly' && AccessControl::isFamilyManager($user)) {
                return $next($request);
            }

            if ($role === 'thanh_vien' && $user) {
                return $next($request);
            }
        }

        return AccessControl::forbidden();
    }
}
