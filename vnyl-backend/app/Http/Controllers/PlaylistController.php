<?php

namespace App\Http\Controllers;

use App\Models\Playlist;
use App\Models\Track;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PlaylistController extends Controller
{
    // List Authenticated User's Playlists
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) { // Fallback, though middleware handles it
             return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $playlists = $user->playlists()
            ->with(['tracks' => function($query) {
                $query->take(4); // Optimize: only need first 4 for cover
            }])
            ->withCount('tracks')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'playlists' => $playlists
        ]);
    }

    // Create New Playlist
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_public' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $playlist = $request->user()->playlists()->create([
            'title' => $request->input('title'),
            'description' => $request->input('description'),
            'is_public' => $request->input('is_public', true)
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Playlist created successfully',
            'playlist' => $playlist
        ], 201);
    }

    // Update Playlist
    public function update(Request $request, $id)
    {
        $playlist = $request->user()->playlists()->find($id);

        if (!$playlist) {
            return response()->json(['status' => 'error', 'message' => 'Playlist not found or access denied'], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'is_public' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $playlist->update($request->only(['title', 'description', 'is_public']));

        return response()->json([
            'status' => 'success',
            'message' => 'Playlist updated successfully',
            'playlist' => $playlist
        ]);
    }

    // Show Playlist Details (with tracks)
    public function show($id)
    {
        $playlist = Playlist::with(['user', 'tracks.user', 'tracks.analysis'])->find($id);

        if (!$playlist) {
            return response()->json(['status' => 'error', 'message' => 'Playlist not found'], 404);
        }

        // Privacy Check
        $user = auth('sanctum')->user();
        $isOwner = $user && $user->id === $playlist->user_id;

        if (!$playlist->is_public && !$isOwner) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized access to private playlist'], 403);
        }

        return response()->json([
            'status' => 'success',
            'playlist' => $playlist,
            'is_owner' => $isOwner
        ]);
    }

    // Add Track to Playlist
    public function addTrack(Request $request, $id)
    {
        $playlist = $request->user()->playlists()->find($id);

        if (!$playlist) {
            return response()->json(['status' => 'error', 'message' => 'Playlist not found or access denied'], 404);
        }

        $validator = Validator::make($request->all(), [
            'track_id' => 'required|exists:tracks,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        // Attach without detaching existing ones, acts as "addToSet"
        // But syncWithoutDetaching accepts IDs. attach throws if unique constraint violated unless caught or checked.
        // Using syncWithoutDetaching is safer for duplicates if not unique constrained on DB, but we added unique constraint.
        // Actually `syncWithoutDetaching` is best usually. 
        $playlist->tracks()->syncWithoutDetaching([$request->input('track_id')]);

        return response()->json([
            'status' => 'success',
            'message' => 'Track added to playlist'
        ]);
    }

    // Remove Track from Playlist
    public function removeTrack(Request $request, $id)
    {
        $playlist = $request->user()->playlists()->find($id);

        if (!$playlist) {
            return response()->json(['status' => 'error', 'message' => 'Playlist not found or access denied'], 404);
        }

        $request->validate([
            'track_id' => 'required|exists:tracks,id'
        ]);

        $playlist->tracks()->detach($request->input('track_id'));

        return response()->json([
            'status' => 'success',
            'message' => 'Track removed from playlist'
        ]);
    }

    // Delete Playlist
    public function destroy(Request $request, $id)
    {
        $playlist = $request->user()->playlists()->find($id);

        if (!$playlist) {
            return response()->json(['status' => 'error', 'message' => 'Playlist not found or access denied'], 404);
        }

        $playlist->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Playlist deleted successfully'
        ]);
    }
}
