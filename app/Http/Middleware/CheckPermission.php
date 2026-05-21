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

            if (in_array($role, ['admin', 'quan_ly', 'family_manager'], true) && AccessControl::isFamilyManager($user)) {
                return $next($request);
            }

            if (in_array($role, ['thanh_vien', 'member', 'authenticated'], true) && $user) {
                return $next($request);
            }
        }

        return AccessControl::forbidden();
    }
}
