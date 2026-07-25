<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    public function follow($id, Request $request)
    {
        $targetUser = User::find($id);
        $currentUser = $request->user();

        if (!$targetUser) {
            return response()->json(['status' => 'error', 'message' => 'User not found'], 404);
        }



        // Check if already following to avoid duplicates (though DB unique constraint handles it)
        if (!$currentUser->following()->where('following_id', $targetUser->id)->exists()) {
            $currentUser->following()->attach($targetUser->id);
            Log::info("User {$currentUser->id} followed user {$targetUser->id}");
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Followed successfully',
            'followers_count' => $targetUser->followers()->count()
        ]);
    }

    public function unfollow($id, Request $request)
    {
        $targetUser = User::find($id);
        $currentUser = $request->user();

        if (!$targetUser) {
            return response()->json(['status' => 'error', 'message' => 'User not found'], 404);
        }

        $currentUser->following()->detach($targetUser->id);
        
        return response()->json([
            'status' => 'success',
            'message' => 'Unfollowed successfully',
            'followers_count' => $targetUser->followers()->count()
        ]);
    }

    public function checkFollowStatus($id, Request $request)
    {
        $currentUser = $request->user();
        $isFollowing = $currentUser->following()->where('following_id', $id)->exists();

        return response()->json([
            'status' => 'success',
            'is_following' => $isFollowing
        ]);
    }

    public function following(Request $request)
    {
        $following = $request->user()->following()->with('artist')->get();
        return response()->json([
            'status' => 'success',
            'following' => $following
        ]);
    }
}
