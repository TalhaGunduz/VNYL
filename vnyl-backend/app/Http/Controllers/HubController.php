<?php

namespace App\Http\Controllers;

use App\Services\YouTubeService;
use App\Models\Track;
use Illuminate\Http\Request;

class HubController extends Controller
{
    protected $youtube;

    // Curated Artist Whitelist for Demo
    protected $curatedArtists = [
        'Tame Impala',
        'Daft Punk',
        'Arctic Monkeys',
        'Radiohead',
        'The Weeknd',
        'Pink Floyd',
        'Kendrick Lamar'
    ];

    public function __construct(YouTubeService $youtube)
    {
        $this->youtube = $youtube;
    }

    /**
     * GET /api/hub
     * Returns a curated list of tracks.
     * Auto-imports if missing.
     */
    public function index()
    {
        // Fetch 50 random tracks from the database to ensure variety and fairness
        // This allows all artists (including new ones) to appear on the Hub.
        $tracks = Track::with('artist')
            ->inRandomOrder()
            ->take(50)
            ->get();

        return response()->json([
            'status' => 'success',
            'tracks' => $tracks // Frontend will handle display
        ]);
    }

    /**
     * Helper to search & import one best match for an artist
     */
    private function importCuratedTrack($query)
    {
        // Search
        $match = $this->youtube->findBestMatch($query);

        if (!$match) return null;

        $videoId = $match['id'];

        // Dupe check
        $exists = Track::where('youtube_video_id', $videoId)->first();
        if ($exists) return $exists;

        // Fetch Detail (Duration)
        $details = $this->youtube->getVideoDetails($videoId);
        $durationIso = $details['items'][0]['contentDetails']['duration'] ?? 'PT0M0S';
        
        $durationSeconds = 0;
        try {
            $interval = new \DateInterval($durationIso);
            $durationSeconds = ($interval->h * 3600) + ($interval->i * 60) + $interval->s;
        } catch (\Exception $e) {}

        // Parse Info
        $title = $match['title'];
        $artist = $match['channel'];

        if (strpos($title, '-') !== false) {
            $parts = explode('-', $title, 2);
            $artist = trim($parts[0]);
            $title = trim($parts[1]);
        }
        
        // Clean Title
        $title = preg_replace('/\s*[\(\[]\s*points*official\s*(audio|video|music video|lyric video|hd|kk|hq)?\s*[\)\]]/i', '', $title);

        // Resolve Artist ID
        $dbArtist = \App\Models\Artist::where('stage_name', 'LIKE', $artist)->first();
        $artistId = $dbArtist ? $dbArtist->id : null;

        // Create
        return Track::create([
            'user_id' => 1, // System admin import
            'title' => trim($title),
            'featured_artist' => trim($artist), // Use refined artist name
            'artist_id' => $artistId,
            'youtube_video_id' => $videoId,
            'cover_image' => $match['cover_image'],
            'duration' => $durationSeconds,
            'status' => 'published',
            'is_public' => true
        ]);
    }
}
