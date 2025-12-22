<?php

namespace App\Http\Controllers;

use App\Models\Track;
use Illuminate\Http\Request;

class LikeController extends Controller
{
    /**
     * Toggle like status for a track.
     */
    public function toggleLike(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $track = Track::findOrFail($id);
        
        // Toggle Logic
        $toggled = $user->likes()->toggle($track->id);
        
        $liked = count($toggled['attached']) > 0;
        
        return response()->json([
            'status' => 'success',
            'liked' => $liked,
            'total_likes' => $track->likes_count // This will trigger the getLikesCountAttribute
        ]);
    }

    /**
     * Get list of tracks liked by the user.
     */
    public function myLikes(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $likes = $user->likes()->with(['user', 'analysis', 'artist'])->latest('track_likes.created_at')->get();

        return response()->json([
            'status' => 'success',
            'tracks' => $likes
        ]);
    }
}
