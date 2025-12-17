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
}
