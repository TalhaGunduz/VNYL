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
use Illuminate\Validation\Rule;

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

        // Mock Mail - Log for debug
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
        // 1. Validation
        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
            'code' => 'required|string', 
            'stage_name' => 'required|string|max:255|unique:artists,stage_name', // Unique in artists table usually
            'primary_genre' => 'required|string',
            'secondary_genres' => 'array', 
            'bio' => 'required|string|min:100',
            'career_status' => 'required|string',
            'location_city' => 'nullable|string',
            'location_country' => 'nullable|string',
            'avatar' => 'nullable', 
            'socials' => 'nullable|array' 
        ]);

        $user = User::where('email', $request->email)->first();

        // 2. Code Check
        if ($user->verification_code !== $request->code) {
            return response()->json(['message' => 'Invalid verification code'], 400);
        }

        if (Carbon::now()->greaterThan($user->verification_code_expires_at)) {
            return response()->json(['message' => 'Verification code expired'], 400);
        }

        // 3. Avatar Upload
        $avatarUrl = null;
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $avatarUrl = url('storage/' . $path);
        } 
        elseif ($request->avatar && str_starts_with($request->avatar, 'data:image')) {
            $image = $request->avatar;
            $image = str_replace(['data:image/png;base64,', 'data:image/jpeg;base64,', ' '], ['', '', '+'], $image);
            $imageName = 'avatar_' . $user->id . '_' . time() . '.png';
            \Illuminate\Support\Facades\Storage::disk('public')->put('avatars/' . $imageName, base64_decode($image));
            $avatarUrl = url('storage/avatars/' . $imageName);
        }
        
        // Also update user avatar if present
        if ($avatarUrl) {
            $user->avatar = $avatarUrl;
        }

        // 4. Update User Role
        $user->role = 'artist';
        $user->verification_status = 'verified';
        $user->verification_code = null;
        $user->verification_code_expires_at = null;
        
        // Sync basic info to user table as well for easier access if needed
        $user->stage_name = $request->stage_name; 
        $user->artist_bio = $request->bio;
        
        $user->save();

        // 5. Create/Update Artist Record
        $artistData = [
            'user_id' => $user->id,
            'stage_name' => $request->stage_name,
            'artist_bio' => $request->bio,     // new field
            'bio' => $request->bio,            // legacy field
            'primary_genre' => $request->primary_genre,
            'secondary_genres' => $request->secondary_genres,
            'career_status' => $request->career_status,
            'location_city' => $request->location_city,
            'location_country' => $request->location_country,
            'avatar' => $avatarUrl, // Save avatar to artist table too
            'is_verified' => true
        ];

        // Handle Socials
        if ($request->has('socials')) {
            $socials = $request->input('socials');
            $artistData['social_instagram'] = $socials['instagram'] ?? null;
            $artistData['social_spotify'] = $socials['spotify'] ?? null;
            $artistData['social_youtube'] = $socials['youtube'] ?? null;
            $artistData['social_soundcloud'] = $socials['soundcloud'] ?? null;
            $artistData['social_apple'] = $socials['apple'] ?? null;
            
            // Legacy / Duplicate for safety if frontend reads from one or other
            $artistData['instagram_handle'] = $socials['instagram'] ?? null;
            $artistData['spotify_id'] = $socials['spotify'] ?? null;
        }

        $artist = Artist::updateOrCreate(
            ['user_id' => $user->id],
            $artistData
        );

        return response()->json([
            'message' => 'Artist profile created successfully',
            'user' => $user->load('artist')
        ], 200);
    }

    // 6. Edit Profile Endpoint (PUT /api/artist/profile)
    public function updateProfile(Request $request)
    {
        $user = auth()->user(); 
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Validate
        $request->validate([
            'stage_name' => 'required|string|max:255',
            'primary_genre' => 'required|string',
            'secondary_genres' => 'array',
            'bio' => 'required|string|min:100',
            'location_city' => 'nullable|string',
            'location_country' => 'nullable|string',
            'socials' => 'nullable|array',
            'avatar' => 'nullable'
        ]);

        // Handle Avatar
        $avatarUrl = null;
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $avatarUrl = url('storage/' . $path);
        } elseif ($request->avatar && str_starts_with($request->avatar, 'data:image')) {
            $image = $request->avatar;
            $image = str_replace(['data:image/png;base64,', 'data:image/jpeg;base64,', ' '], ['', '', '+'], $image);
            $imageName = 'avatar_' . $user->id . '_' . time() . '.png';
            \Illuminate\Support\Facades\Storage::disk('public')->put('avatars/' . $imageName, base64_decode($image));
            $avatarUrl = url('storage/avatars/' . $imageName);
        }

        // Update User table basics
        if ($request->has('stage_name')) $user->stage_name = $request->stage_name;
        if ($request->has('bio')) $user->artist_bio = $request->bio;
        if ($avatarUrl) $user->avatar = $avatarUrl;
        
        $user->save();

        // Update Artist Table
        $artistData = [
            'stage_name' => $request->stage_name,
            'artist_bio' => $request->bio,
            'bio' => $request->bio,
            'primary_genre' => $request->primary_genre,
            'secondary_genres' => $request->secondary_genres,
            'location_city' => $request->location_city,
            'location_country' => $request->location_country,
        ];

        if ($avatarUrl) {
            $artistData['avatar'] = $avatarUrl;
        }

        // Socials
        if ($request->has('socials')) {
            $socials = $request->input('socials');
            // Merge with existing socials if partial update, or overwrite. 
            // Usually update profile sends all form data, so we can overwrite or use null coalesce with existing artist
            
            $currentArtist = $user->artist;
            
            $artistData['social_instagram'] = $socials['instagram'] ?? $currentArtist?->social_instagram;
            $artistData['social_spotify'] = $socials['spotify'] ?? $currentArtist?->social_spotify;
            $artistData['social_youtube'] = $socials['youtube'] ?? $currentArtist?->social_youtube;
            $artistData['social_soundcloud'] = $socials['soundcloud'] ?? $currentArtist?->social_soundcloud;
            $artistData['social_apple'] = $socials['apple'] ?? $currentArtist?->social_apple;
            
            $artistData['instagram_handle'] = $socials['instagram'] ?? $currentArtist?->instagram_handle;
            $artistData['spotify_id'] = $socials['spotify'] ?? $currentArtist?->spotify_id;
        }

        $artist = Artist::updateOrCreate(
            ['user_id' => $user->id],
            $artistData
        );

        return response()->json(['message' => 'Profile updated', 'user' => $user->load('artist')], 200);
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
}
