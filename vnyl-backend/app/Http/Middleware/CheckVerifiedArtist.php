<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckVerifiedArtist
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $email = $request->email ?? $request->input('email');
        if (!$email) {
             $user = $request->user();
        } else {
             $user = \App\Models\User::where('email', $email)->first();
        }

        if (!$user || !$user->artist || !$user->artist->is_verified) {
            return response()->json(['message' => 'Unauthorized: Artist verification required.'], 403);
        }

        return $next($request);
    }
}
