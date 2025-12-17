<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class TrackController extends Controller
{
    public function analyze(Request $request)
    {
        // 1. Validation
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'file' => 'required|file|mimes:mp3,wav,m4a|max:102400', // 100MB max
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        try {
            // 2. Temp File Upload
            // Store in a temporary directory
            $tempPath = $request->file('file')->store('temp', 'local'); // 'local' disk usually storage/app
            
            // Get Absolute Path for Audio Service
            // FIXED: Use Storage facade to get real path (handles 'private' directory mapping)
            $absolutePath = \Illuminate\Support\Facades\Storage::disk('local')->path($tempPath);

            // 3. Call Audio Service
            $audioServiceUrl = 'http://127.0.0.1:8003/analyze/full';
            $response = \Illuminate\Support\Facades\Http::get($audioServiceUrl, [
                'path' => $absolutePath
            ]);

            if ($response->successful()) {
                $analysisData = $response->json();
                $metadata = $analysisData['metadata'] ?? [];

                // Return analysis and temp path to client
                // Client will send this back on "Publish"
                return response()->json([
                    'status' => 'success', 
                    'message' => 'Analysis complete',
                    'temp_path' => $tempPath,
                    'analysis' => $analysisData,
                    'metadata' => $metadata
                ]);
            } else {
                return response()->json([
                    'status' => 'error', 
                    'message' => 'Audio analysis failed', 
                    'details' => $response->body()
                ], 500);
            }

        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function index(Request $request)
    {
        // For now, assume User ID 1 or use auth().
        // Since we are moving towards auth, let's try to get auth user, fallback to 1 only for testing.
        $userId = $request->user() ? $request->user()->id : 1; 

        $tracks = \App\Models\Track::where('user_id', $userId)
            ->with('analysis') // Eager load analysis
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'tracks' => $tracks
        ]);
    }

    /**
     * Get random tracks for Music Hub Discovery
     */
    public function random(Request $request)
    {
        $limit = $request->input('limit', 12);
        
        // Fetch random public tracks. Prefer ones with covers.
        $tracks = \App\Models\Track::where('is_public', true)
                    ->inRandomOrder()
                    ->take($limit)
                    ->get();

        return response()->json([
            'status' => 'success',
            'tracks' => $tracks
        ]);
    }

    public function publish(Request $request)
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'temp_path' => 'required|string', // The path returned from analyze
            'title' => 'required|string|max:255',
            'genre' => 'required|string',
            'featured_artist' => 'nullable|string',
            'cover' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'analysis' => 'required|array' // Pass the analysis data back to save it
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        try {
            $tempPath = $request->input('temp_path');
            
            // Security check: ensure path is inside temp
            if (!str_starts_with($tempPath, 'temp/')) {
                 return response()->json(['status' => 'error', 'message' => 'Invalid file path'], 400);
            }

            if (!\Illuminate\Support\Facades\Storage::disk('local')->exists($tempPath)) {
                return response()->json(['status' => 'error', 'message' => 'File expired or not found. Please re-upload.'], 404);
            }

            // Move file to public/tracks
            $newFilename = 'tracks/' . basename($tempPath);
            // We need to move from 'local' (storage/app) to 'public' (storage/app/public)
            // Or just read stream and write.
            $stream = \Illuminate\Support\Facades\Storage::disk('local')->readStream($tempPath);
            \Illuminate\Support\Facades\Storage::disk('public')->writeStream($newFilename, $stream);
            // Optionally delete temp
            \Illuminate\Support\Facades\Storage::disk('local')->delete($tempPath);

            $coverPath = $request->hasFile('cover') ? $request->file('cover')->store('covers', 'public') : null;

            $userId = 1; // Temporary

            $track = \App\Models\Track::create([
                'user_id' => $userId,
                'title' => $request->input('title'),
                'file_path' => $newFilename,
                'cover_path' => $coverPath,
                'featured_artist' => $request->input('featured_artist'),
                'status' => 'published' // User clicked publish
            ]);

            $analysisData = $request->input('analysis');

            $track->analysis()->create([
                'bpm' => $analysisData['bpm'] ?? null,
                'duration' => $analysisData['duration'] ?? null,
                'energy' => $analysisData['energy'] ?? null,
                'mood' => $analysisData['mood'] ?? null,
                'loudness' => $analysisData['loudness'] ?? null,
                'key' => $analysisData['key'] ?? null,
                'tempo_class' => $analysisData['tempo_class'] ?? null,
                'primary_genre' => $request->input('genre'), // Use the locked genre passed from frontend
                'genre_distribution' => $analysisData['genre_distribution'] ?? null,
            ]);

            $track->load('analysis');

            return response()->json([
                'status' => 'success',
                'message' => 'Track published successfully',
                'track' => $track
            ]);

        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $track = \App\Models\Track::find($id);
        if (!$track) {
            return response()->json(['status' => 'error', 'message' => 'Track not found'], 404);
        }

        // Delete files
        if ($track->file_path) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($track->file_path);
        }
        if ($track->cover_path) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($track->cover_path);
        }

        $track->delete();

        return response()->json(['status' => 'success', 'message' => 'Track deleted']);
    }

    /**
     * Import a track from YouTube (Prompt 4)
     */
    public function importFromYouTube(Request $request, \App\Services\YouTubeService $youtube)
    {
        $request->validate([
            'query' => 'required|string|min:2',
        ]);

        $query = $request->input('query');

        // 1. Search YouTube
        $results = $youtube->search($query, 1);

        if (empty($results['items'])) {
            return response()->json(['message' => 'No video found on YouTube'], 404);
        }

        $item = $results['items'][0];
        $videoId = $item['id']['videoId'];
        
        // 2. Check if already exists
        $existing = \App\Models\Track::where('youtube_video_id', $videoId)->first();
        if ($existing) {
            return response()->json([
                'status' => 'success',
                'message' => 'Track already imported',
                'track' => $existing
            ]);
        }

        // 3. Get Details (Duration)
        $details = $youtube->getVideoDetails($videoId);
        $durationIso = $details['items'][0]['contentDetails']['duration'] ?? 'PT0M0S';
        
        // Convert ISO 8601 duration to seconds (Simple regex approximation)
        // Or use DateInterval
        try {
            $interval = new \DateInterval($durationIso);
            $durationSeconds = ($interval->h * 3600) + ($interval->i * 60) + $interval->s;
        } catch (\Exception $e) {
            $durationSeconds = 0;
        }

        // 4. Save to DB
        // Determine Artist and Title from video title (often "Artist - Title")
        $videoTitle = $item['snippet']['title'];
        $artist = $item['snippet']['channelTitle'];
        $title = $videoTitle;

        // Simple heuristic: if "-" exists, split it
        if (strpos($videoTitle, '-') !== false) {
            $parts = explode('-', $videoTitle, 2);
            $artist = trim($parts[0]);
            $title = trim($parts[1]);
        }

        $track = \App\Models\Track::create([
            'user_id' => $request->user() ? $request->user()->id : 1, // Fallback for dev
            'title' => $title,
            'featured_artist' => $artist, // Storing "Artist" in featured_artist for now based on Prompt 3 mapping
                                         // Prompt 3 asked for "artist" field, but our DB has "featured_artist" or relies on User relationships.
                                         // I will use `featured_artist` to store the YouTube Channel/Artist name for now as existing tracks table relies on User ownership.
                                         // Ideally, we should have an `artist_name` string column if it's not our platform user.
            'youtube_video_id' => $videoId,
            'cover_image' => $item['snippet']['thumbnails']['high']['url'] ?? $item['snippet']['thumbnails']['medium']['url'],
            'duration' => $durationSeconds,
            'status' => 'published',
            'is_public' => true
        ]);

        return response()->json([
            'status' => 'success',
            'track' => $track
        ]);
    }
}
