<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class BypassFilamentAuth
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        // Allow access to admin login and auth routes without authentication
        if ($request->is('admin/login') || $request->is('admin/auth/*')) {
            return $next($request);
        }

        return $next($request);
    }
}
