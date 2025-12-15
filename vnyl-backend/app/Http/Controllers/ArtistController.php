<?php

namespace App\Http\Controllers;

use App\Models\Artist;
use App\Models\User;
use App\Notifications\ArtistVerificationCode;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

class ArtistController extends Controller
{
    // A. Send Verification Code
    public function sendVerification(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // Generate 6-digit code
        $code = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);

        // Update User
        $user->update([
            'verification_code' => $code,
            'verification_code_expires_at' => Carbon::now()->addMinutes(10)
        ]);

        // Mock Mail: Log it explicitly for "Fake Mail" requirement
        Log::info(" ====== MOCK EMAIL SERVICE ======");
        Log::info(" SENDING VERIFICATION TO: " . $user->email);
        Log::info(" VERIFICATION CODE: " . $code);
        Log::info(" ================================");

        // Send Email
        $user->notify(new ArtistVerificationCode($code));

        return response()->json([
            'message' => 'Verification code sent',
            'expires_in' => '10 minutes',
            'debug_code' => $code 
        ], 200);
    }

    // A.5 Verify Code (Intermediate Step)
    public function verifyCode(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['valid' => false, 'message' => 'User not found'], 404);
        }

        if ($user->verification_code !== $request->code) {
            return response()->json(['valid' => false, 'message' => 'Invalid verification code'], 400);
        }

        if (Carbon::now()->greaterThan($user->verification_code_expires_at)) {
            return response()->json(['valid' => false, 'message' => 'Verification code expired'], 400);
        }

        return response()->json(['valid' => true], 200);
    }

    // B. Verify & Upgrade User (Final Step)
    public function verifyAndUpgrade(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string',
            'stage_name' => 'required|string',
            'primary_genre' => 'required|string',
            'secondary_genres' => 'nullable|array',
            'career_status' => 'required|string',
            'location_city' => 'nullable|string',
            'location_country' => 'nullable|string',
            'bio' => 'nullable|string',
            'avatar' => 'nullable|string',
            'social_instagram' => 'nullable|string',
            'social_spotify' => 'nullable|string',
            'social_youtube' => 'nullable|string',
            'social_soundcloud' => 'nullable|string',
            'social_apple' => 'nullable|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // 1. Security Check: Re-verify Code
        if ($user->verification_code !== $request->code) {
            return response()->json(['message' => 'Invalid verification code'], 400);
        }

        if (Carbon::now()->greaterThan($user->verification_code_expires_at)) {
            return response()->json(['message' => 'Verification code expired'], 400);
        }

        // 2. Update User Details (Role & Avatar Only)
        $userData = [
            'role' => 'artist',
            'verification_status' => 'verified',
            'verification_code' => null,
            'verification_code_expires_at' => null,
        ];
        
        // Handle Avatar (User Table)
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $userData['avatar'] = url('storage/' . $path);
        } elseif ($request->avatar && str_starts_with($request->avatar, 'data:image')) {
            $image = $request->avatar;
            $image = str_replace(['data:image/png;base64,', 'data:image/jpeg;base64,', ' '], ['', '', '+'], $image);
            $imageName = 'avatar_' . $user->id . '_' . time() . '.png';
            Storage::disk('public')->put('avatars/' . $imageName, base64_decode($image));
            $userData['avatar'] = url('storage/avatars/' . $imageName);
        } elseif ($request->avatar) {
            $userData['avatar'] = $request->avatar;
        }

        $user->update($userData);

        // 3. Create or Update Artist Profile (All Artist Details Here)
        $artist = Artist::firstOrCreate(['user_id' => $user->id]);

        $artistData = [
            'is_verified' => true,
            'stage_name' => $request->stage_name,
            'artist_bio' => $request->bio,
            'primary_genre' => $request->primary_genre,
            'secondary_genres' => $request->secondary_genres,
            'career_status' => $request->career_status,
        ];

        if ($request->location_city) $artistData['location_city'] = $request->location_city;
        if ($request->location_country) $artistData['location_country'] = $request->location_country;

        // Handle Socials
        if ($request->has('socials')) {
            $socials = $request->input('socials');
            $artistData['social_instagram'] = $socials['instagram'] ?? null;
            $artistData['social_spotify'] = $socials['spotify'] ?? null;
            $artistData['social_youtube'] = $socials['youtube'] ?? null;
            $artistData['social_soundcloud'] = $socials['soundcloud'] ?? null;
            $artistData['social_apple'] = $socials['apple'] ?? null;
        } else {
             if ($request->social_instagram) $artistData['social_instagram'] = $request->social_instagram;
             if ($request->social_spotify) $artistData['social_spotify'] = $request->social_spotify;
             if ($request->social_youtube) $artistData['social_youtube'] = $request->social_youtube;
             if ($request->social_soundcloud) $artistData['social_soundcloud'] = $request->social_soundcloud;
             if ($request->social_apple) $artistData['social_apple'] = $request->social_apple;
        }
        
        // Sync legacy fields if needed
        $artistData['instagram_handle'] = $artistData['social_instagram'];
        $artistData['spotify_id'] = $artistData['social_spotify'];

        $artist->update($artistData);

        return response()->json([
            'message' => 'User upgraded to artist successfully',
            'user' => $user->load('artist')
        ], 200);
    }

    // C. Get Artist Statistics (Mock)
    public function getStats()
    {
        return response()->json([
            'total_streams' => 15400,
            'monthly_listeners' => 1200,
            'followers' => 450
        ]);
    }

    // Deprecated methods from previous iteration can remain or be removed/aliased
    // Keeping create/verifyCode for backward compatibility if needed, but the new flow replaces them.
}
