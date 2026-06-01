<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class XssProtection
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        $input = $request->all();

        array_walk_recursive($input, function (&$value) {
            if (is_string($value)) {
                // Strip tags để loại bỏ hoàn toàn các thẻ HTML/Script gây hại
                $value = strip_tags($value);
            }
        });

        $request->merge($input);

        return $next($request);
    }
}
