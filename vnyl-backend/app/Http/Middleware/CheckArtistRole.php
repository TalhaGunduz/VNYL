<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckArtistRole
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // For testing/hackathon purposes, we check user based on email in request if token not used
        // But ideally use $request->user() with proper auth
        
        $email = $request->email ?? $request->input('email');
        if (!$email) { // Fallback to auth user if valid
             $user = $request->user();
        } else {
             $user = \App\Models\User::where('email', $email)->first();
        }

        if (!$user || $user->role !== 'artist') {
            return response()->json(['message' => 'Unauthorized: Only artists can access this.'], 403);
        }

        return $next($request);
    }
}
