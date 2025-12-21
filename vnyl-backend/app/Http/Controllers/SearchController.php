<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Track;
use App\Models\Artist;

class SearchController extends Controller
{
    /**
     * Search for Artists and Tracks
     */
    public function index(Request $request)
    {
        $query = $request->input('query');

        if (!$query) {
            return response()->json([
                'status' => 'success',
                'artists' => [],
                'tracks' => []
            ]);
        }

        // 1. Search Artists
        $artists = Artist::where('stage_name', 'LIKE', "%{$query}%")
            ->take(3)
            ->get(['id', 'stage_name', 'avatar', 'slug']);

        // 2. Search Tracks
        $tracks = Track::with('artist')
            ->where('title', 'LIKE', "%{$query}%")
            ->orWhere('featured_artist', 'LIKE', "%{$query}%")
            ->take(5)
            ->get();

        return response()->json([
            'status' => 'success',
            'artists' => $artists,
            'tracks' => $tracks
        ]);
    }
}
