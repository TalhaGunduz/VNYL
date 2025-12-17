<?php

namespace App\Http\Controllers;

use App\Services\YouTubeService;
use App\Models\Track;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class YouTubeController extends Controller
{
    protected $youtube;

    public function __construct(YouTubeService $youtube)
    {
        $this->youtube = $youtube;
    }

    /**
     * Step 2: Search YouTube
     * POST /api/youtube/search
     */
    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|min:2',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }

        $query = $request->input('query');
        $results = $this->youtube->search($query, 10); // Check 10 results

        if (isset($results['error'])) {
            return response()->json($results, 500);
        }

        // Return raw results as requested, or formatted?
        // Prompt says "Return raw YouTube search results".
        return response()->json([
            'status' => 'success',
            'results' => $results
        ]);
    }

    /**
     * Step 3: Import Track
     * POST /api/youtube/import
     */
    public function import(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|min:2',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }

        $query = $request->input('query');

        // 1. Find Best Match (Filtered)
        $match = $this->youtube->findBestMatch($query);

        if (!$match) {
            return response()->json(['message' => 'No suitable music video found'], 404);
        }

        $videoId = $match['id'];

        // 2. Check if already exists (Idempotency)
        $existing = Track::where('youtube_video_id', $videoId)->first();
        if ($existing) {
            return response()->json([
                'status' => 'success',
                'message' => 'Track already in database',
                'track' => $existing
            ]);
        }

        // 3. Get Details for Duration
        $details = $this->youtube->getVideoDetails($videoId);
        $durationIso = $details['items'][0]['contentDetails']['duration'] ?? 'PT0M0S';
        
        $durationSeconds = 0;
        try {
            $interval = new \DateInterval($durationIso);
            $durationSeconds = ($interval->h * 3600) + ($interval->i * 60) + $interval->s;
        } catch (\Exception $e) {
            // keep 0
        }

        // 4. Parse Title/Artist (Refined)
        $videoTitle = $match['title'];
        $channel = $match['channel'];
        
        $artist = $channel;
        $title = $videoTitle;

        // "Artist - Title" parser
        if (strpos($videoTitle, '-') !== false) {
            $parts = explode('-', $videoTitle, 2);
            $artist = trim($parts[0]);
            $title = trim($parts[1]);
        }
        
        // Remove "Official Audio" etc from title if present to keep it clean
        // Regex to remove (Official Audio), [Official Video], etc.
        $title = preg_replace('/\s*[\(\[]\s*points*official\s*(audio|video|music video|lyric video)?\s*[\)\]]/i', '', $title);

        $userId = $request->user() ? $request->user()->id : 1;

        $track = Track::create([
            'user_id' => $userId,
            'title' => trim($title),
            'featured_artist' => trim($artist),
            'youtube_video_id' => $videoId,
            'cover_image' => $match['cover_image'],
            'duration' => $durationSeconds,
            'status' => 'published',
            'is_public' => true
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Track imported successfully',
            'track' => $track,
            'source_match' => $match
        ]);
    }
}
