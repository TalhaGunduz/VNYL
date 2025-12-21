<?php

namespace App\Http\Controllers;

use App\Models\Artist;
use Illuminate\Http\Request;

class ArtistController extends Controller
{
    // GET /api/artists
    public function index()
    {
        $artists = Artist::withCount('tracks')->get();
        return response()->json([
            'status' => 'success',
            'artists' => $artists
        ]);
    }

    // GET /api/artists/{slug}
    public function show($slug)
    {
        $artist = Artist::where('slug', $slug)->firstOrFail();
        
        return response()->json([
            'status' => 'success',
            'artist' => $artist
        ]);
    }

    // GET /api/artists/{slug}/tracks
    public function tracks($slug)
    {
        $artist = Artist::where('slug', $slug)->firstOrFail();
        $tracks = $artist->tracks()->inRandomOrder()->take(10)->get();

        return response()->json([
            'status' => 'success',
            'tracks' => $tracks
        ]);
    }
    // --- Artist Authentication Flow ---

    public function sendVerification(Request $request)
    {
        // Mock email sending for local dev
        $user = $request->user();
        if (!$user) {
            // If strictly public endpoint, validate email
             $request->validate(['email' => 'required|email']);
             // In a real app we'd find user by email. 
             // But for this flow, we usually assume logged in user upgrading.
             return response()->json(['status' => 'error', 'message' => 'User not found'], 404);
        }

        // Generate Real Code
        $code = (string) mt_rand(100000, 999999);
        $user->verification_code = $code;
        $user->save();

        // Send Email
        try {
            \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\ArtistVerificationCode($code));
            
            // Log for backup debug
            \Illuminate\Support\Facades\Log::info("Sent verification code to {$user->email}: $code");

            return response()->json([
                'status' => 'success',
                'message' => 'Verification code sent to your email.'
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Mail Send Failed: " . $e->getMessage());
            
            // Fallback for dev environment without mail config
            return response()->json([
                'status' => 'success', // Fake success but show code in message for dev
                'message' => 'Could not send email (Localhost). Your code is: ' . $code,
                'dev_code' => $code 
            ]);
        }
    }

    public function verifyCode(Request $request)
    {
        $request->validate([
            'code' => 'required|string'
        ]);

        $user = $request->user();
        
        if ($user->verification_code === $request->code) {
            $user->verification_status = 'verified';
            $user->verification_code = null; // Clear code
            $user->save();

            return response()->json(['status' => 'success', 'message' => 'Email verified']);
        }

        return response()->json(['status' => 'error', 'message' => 'Invalid code'], 400);
    }

    public function verifyAndUpgrade(Request $request)
    {
        $request->validate([
            'stage_name' => 'required|string|max:255',
            'bio' => 'nullable|string',
            'primary_genre' => 'required|string',
        ]);

        $user = $request->user();

        // 1. Update User Role
        $user->role = 'artist';
        $user->stage_name = $request->stage_name;
        $user->artist_bio = $request->bio;
        $user->primary_genre = $request->primary_genre;
        
        // 2. Create Artist Record (Link)
        // Check if exists first
        $artist = Artist::firstOrCreate(
            ['user_id' => $user->id],
            [
                'stage_name' => $request->stage_name,
                'slug' => \Illuminate\Support\Str::slug($request->stage_name),
                'artist_bio' => $request->bio,
                'avatar' => $user->avatar ?? 'https://ui-avatars.com/api/?name=' . urlencode($request->stage_name)
            ]
        );

        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Welcome to the Artist Club!',
            'user' => $user,
            'artist' => $artist
        ]);
    }

    public function updateProfile(Request $request) 
    {
         $user = $request->user();
         
         // Update user fields
         $user->update($request->only(['stage_name', 'artist_bio', 'location', 'website', 'social_instagram']));

         // Sync Artist record if exists
         $artist = Artist::where('user_id', $user->id)->first();
         if ($artist) {
             $artist->stage_name = $user->stage_name;
             $artist->artist_bio = $user->artist_bio;
             $artist->save();
         }

         return response()->json(['status' => 'success', 'user' => $user]);
    }

    public function getStats(Request $request)
    {
        // Mock stats for dashboard
        return response()->json([
            'status' => 'success',
            'stats' => [
                'total_streams' => 12500,
                'monthly_listeners' => 3400,
                'followers' => 850
            ]
        ]);
    }
}
