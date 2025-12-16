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
        \Illuminate\Support\Facades\Storage::disk('public')->delete($track->file_path);
        if ($track->cover_path) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($track->cover_path);
        }

        $track->delete();

        return response()->json(['status' => 'success', 'message' => 'Track deleted']);
    }
}
