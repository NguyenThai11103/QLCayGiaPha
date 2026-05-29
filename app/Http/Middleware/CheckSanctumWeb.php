<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSanctumWeb
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->bearerToken()) {
            $cookieName = str_starts_with($request->path(), 'admin') ? 'admin_auth_token' : 'user_auth_token';
            $token = $request->cookie($cookieName) ?: $request->cookie('auth_token');

            if ($token) {
                $request->headers->set('Authorization', 'Bearer ' . $token);
            }
        }

        return $next($request);
    }
}
