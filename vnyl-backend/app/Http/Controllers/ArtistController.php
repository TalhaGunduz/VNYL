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

        // Mock Mail
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
        // 1. Validasyon
        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
            'code' => 'required|string', 
            'stage_name' => 'required|string|max:255|unique:users,stage_name', 
            'primary_genre' => 'required|string',
            'secondary_genres' => 'array', 
            'bio' => 'required|string|min:100',
            'career_status' => 'required|string',
            'location_city' => 'nullable|string',
            'location_country' => 'nullable|string',
            'avatar' => 'nullable', // Dosya veya URL olabilir
            'socials' => 'nullable|array' // Frontend 'socials' objesi yolluyor
        ]);

        $user = User::where('email', $request->email)->first();

        // 2. Kod Kontrolü
        if ($user->verification_code !== $request->code) {
            return response()->json(['message' => 'Invalid verification code'], 400);
        }

        if (Carbon::now()->greaterThan($user->verification_code_expires_at)) {
            return response()->json(['message' => 'Verification code expired'], 400);
        }

        // 3. Avatar Upload
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar = url('storage/' . $path);
        } 
        elseif ($request->avatar && str_starts_with($request->avatar, 'data:image')) {
            $image = $request->avatar;
            $image = str_replace(['data:image/png;base64,', 'data:image/jpeg;base64,', ' '], ['', '', '+'], $image);
            $imageName = 'avatar_' . $user->id . '_' . time() . '.png';
            
            \Illuminate\Support\Facades\Storage::disk('public')->put('avatars/' . $imageName, base64_decode($image));
            $user->avatar = url('storage/avatars/' . $imageName);
        }

        // 4. Update Data
        $user->stage_name = $request->stage_name;
        $user->artist_bio = $request->bio;
        $user->primary_genre = $request->primary_genre;
        $user->secondary_genres = $request->secondary_genres;
        $user->career_status = $request->career_status;
        $user->location_city = $request->location_city;
        $user->location_country = $request->location_country;
        
        // Handle Socials
        if ($request->has('socials')) {
            $socials = $request->input('socials');
            $user->social_instagram = $socials['instagram'] ?? null;
            $user->social_spotify = $socials['spotify'] ?? null;
            $user->social_youtube = $socials['youtube'] ?? null;
            $user->social_soundcloud = $socials['soundcloud'] ?? null;
            $user->social_apple = $socials['apple'] ?? null;
        }

        // 5. Status Update
        $user->role = 'artist';
        $user->verification_status = 'verified';
        $user->verification_code = null;
        $user->verification_code_expires_at = null;

        $user->save();

        // Optional: Keep Artist table for ID reference
        Artist::firstOrCreate(['user_id' => $user->id], ['is_verified' => true]);

        return response()->json([
            'message' => 'Artist profile created successfully',
            'user' => $user->load('artist')
        ], 200);
    }

    // 6. Edit Profile Endpoint (PUT /api/artist/profile)
    public function updateProfile(Request $request)
    {
        $user = auth()->user(); // Get authenticated user
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'stage_name' => ['required', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'primary_genre' => 'required|string',
            'secondary_genres' => 'array',
            'bio' => 'required|string|min:100',
            'location_city' => 'nullable|string',
            'location_country' => 'nullable|string',
            'socials' => 'nullable|array',
            'avatar' => 'nullable'
        ]);

        // Handle Avatar
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar = url('storage/' . $path);
        } elseif ($request->avatar && str_starts_with($request->avatar, 'data:image')) {
            $image = $request->avatar;
            $image = str_replace(['data:image/png;base64,', 'data:image/jpeg;base64,', ' '], ['', '', '+'], $image);
            $imageName = 'avatar_' . $user->id . '_' . time() . '.png';
            \Illuminate\Support\Facades\Storage::disk('public')->put('avatars/' . $imageName, base64_decode($image));
            $user->avatar = url('storage/avatars/' . $imageName);
        }

        $user->stage_name = $request->stage_name;
        $user->artist_bio = $request->bio;
        $user->primary_genre = $request->primary_genre;
        $user->secondary_genres = $request->secondary_genres;
        $user->location_city = $request->location_city;
        $user->location_country = $request->location_country;

        // Update Socials
        if ($request->has('socials')) {
            $socials = $request->input('socials');
            // Use ?? $user->social_... to keep existing if not sent
            $user->social_instagram = $socials['instagram'] ?? $user->social_instagram;
            $user->social_spotify = $socials['spotify'] ?? $user->social_spotify;
            $user->social_youtube = $socials['youtube'] ?? $user->social_youtube;
            $user->social_soundcloud = $socials['soundcloud'] ?? $user->social_soundcloud;
            $user->social_apple = $socials['apple'] ?? $user->social_apple;
        }

        $user->save();

        return response()->json(['message' => 'Profile updated', 'user' => $user], 200);
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
