<?php

namespace App\Http\Controllers;

use App\Services\YouTubeService;
use Illuminate\Http\Request;

class YouTubeTestController extends Controller
{
    protected $youtube;

    public function __construct(YouTubeService $youtube)
    {
        $this->youtube = $youtube;
    }

    public function testSearch()
    {
        // PROMPT 2 Requirement: Search for "Daft Punk One More Time"
        $query = "Daft Punk One More Time";
        
        $results = $this->youtube->search($query, 1);

        if (isset($results['error'])) {
            return response()->json($results, 500);
        }

        if (empty($results['items'])) {
            return response()->json(['message' => 'No results found'], 404);
        }

        $item = $results['items'][0];

        // Format as requested in Prompt 2
        return response()->json([
            'status' => 'success',
            'query' => $query,
            'data' => [
                'title' => $item['snippet']['title'],
                'channelTitle' => $item['snippet']['channelTitle'],
                'videoId' => $item['id']['videoId'],
                'thumbnail' => $item['snippet']['thumbnails']['high']['url'] ?? $item['snippet']['thumbnails']['default']['url'],
            ]
        ]);
    }
}
