<?php

namespace App\Http\Controllers;

use App\Models\Artist;
use Illuminate\Http\Request;
use Carbon\Carbon;

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
        $artist = Artist::where('slug', $slug)
            ->orWhere('user_id', $slug)
            ->orWhere('id', $slug)
            ->with('user') // Eager load user for follow button check
            ->firstOrFail();
        
        return response()->json([
            'status' => 'success',
            'artist' => $artist
        ]);
    }

    // GET /api/artists/{slug}/tracks
    public function tracks($slug)
    {
        $artist = Artist::where('slug', $slug)
            ->orWhere('user_id', $slug)
            ->orWhere('id', $slug)
            ->firstOrFail();
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
            'location_city' => 'nullable|string',
            'location_country' => 'nullable|string',
            'avatar' => 'nullable|string', // URL from frontend
        ]);

        $user = $request->user();

        // 1. Update User Role and Fields
        $user->role = 'artist';
        $user->stage_name = $request->stage_name;
        $user->artist_bio = $request->bio;
        $user->primary_genre = $request->primary_genre;
        $user->location_city = $request->location_city;
        $user->location_country = $request->location_country;
        if ($request->avatar) {
            // Note: If frontend sends blob: URL, it won't work for public. 
            // Ideally frontend should upload file first or send base64 (if DB allows).
            // For now we accept what is sent to prevent crash.
            $user->avatar = $request->avatar;
        }
        $user->save();
        
        // 2. Create/Update Artist Record
        
        // Generate Unique Slug
        $slug = \Illuminate\Support\Str::slug($request->stage_name);
        $originalSlug = $slug;
        $count = 1;
        
        // Check if slug exists for OTHER users
        while (Artist::where('slug', $slug)->where('user_id', '!=', $user->id)->exists()) {
            $slug = $originalSlug . '-' . $count;
            $count++;
        }

        $artist = Artist::updateOrCreate(
            ['user_id' => $user->id],
            [
                'stage_name' => $request->stage_name,
                'slug' => $slug,
                'artist_bio' => $request->bio,
                'avatar' => $user->avatar ?? 'https://ui-avatars.com/api/?name=' . urlencode($request->stage_name)
            ]
        );

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
        
        $validatedData = $request->validate([
            'stage_name' => 'nullable|string|max:255',
            'bio' => 'nullable|string',
            'primary_genre' => 'nullable|string',
            'secondary_genres' => 'nullable|array',
            'location_city' => 'nullable|string',
            'location_country' => 'nullable|string',
            'socials' => 'nullable|array',
            'avatar' => 'nullable|image|max:5120', // 5MB limit
        ]);

        // Map bio to artist_bio for User model
        if ($request->has('bio')) {
            $user->artist_bio = $request->bio;
        }

        // Handle direct fields
        $user->fill($request->only([
            'stage_name', 'primary_genre', 'secondary_genres', 
            'location_city', 'location_country'
        ]));

        // Handle Socials - map from array to individual columns
        if ($request->has('socials')) {
            $socials = $request->input('socials');
            $user->social_instagram = $socials['instagram'] ?? $user->social_instagram;
            $user->social_spotify = $socials['spotify'] ?? $user->social_spotify;
            $user->social_youtube = $socials['youtube'] ?? $user->social_youtube;
            $user->social_soundcloud = $socials['soundcloud'] ?? $user->social_soundcloud;
            $user->social_apple = $socials['apple'] ?? $user->social_apple;
        }

        // Handle Avatar Upload
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar = 'http://127.0.0.1:8000/storage/' . $path;
        }

        $user->save();

        // Sync Artist record
        $artist = Artist::firstOrCreate(['user_id' => $user->id]);
        $artist->stage_name = $user->stage_name;
        $artist->artist_bio = $user->artist_bio;
        $artist->avatar = $user->avatar;

        // Generate Unique Slug
        $slug = \Illuminate\Support\Str::slug($user->stage_name);
        $originalSlug = $slug;
        $count = 1;
        
        // Check if slug exists for OTHER artists
        while (Artist::where('slug', $slug)->where('id', '!=', $artist->id)->exists()) {
            $slug = $originalSlug . '-' . $count;
            $count++;
        }
        
        $artist->slug = $slug;
        $artist->save();

        return response()->json([
            'status' => 'success', 
            'user' => $user->load('artist')
        ]);
    }

    public function getStats(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['status' => 'error'], 401);
        
        $artist = Artist::where('user_id', $user->id)->first();
        if (!$artist) {
            return response()->json(['status' => 'success', 'stats' => [
                'total_streams' => 0, 'streams_growth' => 0,
                'monthly_listeners' => 0, 'listeners_growth' => 0,
                'followers' => 0, 'followers_growth' => 0
            ]]);
        }

        $now = Carbon::now('Europe/Istanbul');
        $range = $request->input('range', 'total');
        
        $streamsValue = 0;
        $prevStreams = 0;
        $followersValue = 0;
        $prevFollowers = 0;

        $trackIds = \App\Models\Track::where('user_id', $user->id)->pluck('id');

        if ($range === 'daily') {
            // Daily: Today vs Yesterday
            $today = $now->toDateString();
            $yesterday = (clone $now)->subDay()->toDateString();
            
            $streamsValue = \App\Models\TrackDailyStat::whereIn('track_id', $trackIds)
                ->where('date', $today)
                ->sum('plays');
            $prevStreams = \App\Models\TrackDailyStat::whereIn('track_id', $trackIds)
                ->where('date', $yesterday)
                ->sum('plays');
            
            // Followers gained Today
            $followersValue = $user->followers()->wherePivot('created_at', '>=', (clone $now)->startOfDay())->count();
            $prevFollowers = $user->followers()
                ->wherePivot('created_at', '>=', (clone $now)->subDay()->startOfDay())
                ->wherePivot('created_at', '<', (clone $now)->startOfDay())
                ->count();
            
        } elseif ($range === 'monthly') {
            // Monthly: This Month vs Last Month
            $streamsValue = \App\Models\TrackDailyStat::whereIn('track_id', $trackIds)
                ->whereMonth('date', $now->month)
                ->whereYear('date', $now->year)
                ->sum('plays');
            
            $prevStreams = \App\Models\TrackDailyStat::whereIn('track_id', $trackIds)
                ->whereMonth('date', (clone $now)->subMonth()->month)
                ->whereYear('date', (clone $now)->subMonth()->year)
                ->sum('plays');

            $followersValue = $user->followers()->wherePivot('created_at', '>=', (clone $now)->startOfMonth())->count();
            $prevFollowers = $user->followers()
                ->wherePivot('created_at', '>=', (clone $now)->subMonth()->startOfMonth())
                ->wherePivot('created_at', '<', (clone $now)->startOfMonth())
                ->count();

        } else {
            // Total (Default)
            $streamsValue = \App\Models\Track::where('user_id', $user->id)->sum('plays');
            $today = $now->toDateString();
            $playsToday = \App\Models\TrackDailyStat::whereIn('track_id', $trackIds)
                ->where('date', $today)
                ->sum('plays');
            $prevStreams = $streamsValue - $playsToday; // Total yesterday

            $followersValue = $user->followers()->count();
            $prevFollowers = $user->followers()->wherePivot('created_at', '<', (clone $now)->startOfDay())->count();
        }

        // Calculate Growth %
        $streamsGrowth = null;
        $listenersGrowth = null;
        $followersGrowth = null;

        if ($range !== 'total') {
            if ($prevStreams > 0) {
                $streamsGrowth = (($streamsValue - $prevStreams) / $prevStreams) * 100;
            } elseif ($streamsValue > 0) {
                $streamsGrowth = 100;
            }
            $streamsGrowth = round($streamsGrowth, 1);
            $listenersGrowth = $streamsGrowth;

            if ($prevFollowers > 0) {
                $followersGrowth = (($followersValue - $prevFollowers) / $prevFollowers) * 100;
            } elseif ($followersValue > 0) {
                $followersGrowth = 100;
            }
            $followersGrowth = round($followersGrowth, 1);
        }

        $listenersValue = floor($streamsValue * 0.4);

        // Graph Data (Last 7 Days)
        $graph = [];
        for ($i = 6; $i >= 0; $i--) {
            $dateObj = (clone $now)->subDays($i);
            $dateString = $dateObj->toDateString();
            $dayLabel = $dateObj->format('D');

            $plays = \App\Models\TrackDailyStat::whereIn('track_id', $trackIds)
                ->where('date', $dateString)
                ->sum('plays');
            
            $graph[] = [
                'label' => $dayLabel,
                'value' => (int) $plays
            ];
        }

        return response()->json([
            'status' => 'success',
            'stats' => [
                'total_streams' => $streamsValue,
                'streams_growth' => $streamsGrowth,
                'monthly_listeners' => $listenersValue,
                'listeners_growth' => $listenersGrowth, 
                'followers' => $followersValue,
                'followers_growth' => $followersGrowth,
                'graph' => $graph
            ]
        ]);
    }

    public function getRecentActivity(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['status' => 'error'], 401);

        // 1. Get Recent Likes on User's Tracks
        $trackIds = \App\Models\Track::where('user_id', $user->id)->pluck('id');
        
        $recentLikes = \Illuminate\Support\Facades\DB::table('track_likes')
            ->join('users', 'track_likes.user_id', '=', 'users.id')
            ->join('tracks', 'track_likes.track_id', '=', 'tracks.id')
            ->whereIn('track_likes.track_id', $trackIds)
            ->select(
                'users.name as user_name', 
                'users.avatar as user_avatar', 
                'tracks.title as track_title',
                'track_likes.created_at',
                \Illuminate\Support\Facades\DB::raw('"like" as type')
            )
            ->orderBy('track_likes.created_at', 'desc')
            ->limit(10)
            ->get();

        // 2. Get Recent Followers
        $recentFollowers = \Illuminate\Support\Facades\DB::table('followers')
            ->join('users', 'followers.follower_id', '=', 'users.id')
            ->where('followers.following_id', $user->id)
            ->select(
                'users.name as user_name',
                'users.avatar as user_avatar',
                \Illuminate\Support\Facades\DB::raw('NULL as track_title'),
                'followers.created_at',
                \Illuminate\Support\Facades\DB::raw('"follow" as type')
            )
            ->orderBy('followers.created_at', 'desc')
            ->limit(10)
            ->get();
        
        // Merge and Sort
        $activity = $recentLikes->merge($recentFollowers)
            ->sortByDesc('created_at')
            ->take(10)
            ->values();

        return response()->json([
            'status' => 'success',
            'activity' => $activity
        ]);
    }
}
