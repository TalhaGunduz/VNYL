<?php


use App\Http\Controllers\AuthController;
use App\Http\Controllers\TrackController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AudioServiceController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\PlaylistController;

Route::post('/register', [AuthController::class, 'register']);
// YouTube Integration Routes
Route::post('/youtube/search', [\App\Http\Controllers\YouTubeController::class, 'search']);
Route::post('/youtube/import', [\App\Http\Controllers\YouTubeController::class, 'import']);

// Standard Routes
Route::post('/login', [\App\Http\Controllers\AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/logout', [\App\Http\Controllers\AuthController::class, 'logout']);
    
    // Profile Management
    Route::put('/user/profile', [\App\Http\Controllers\AuthController::class, 'updateProfile']);
    Route::delete('/user/account', [\App\Http\Controllers\AuthController::class, 'deleteAccount']);

    // Track Management
    Route::get('/tracks', [\App\Http\Controllers\TrackController::class, 'index']); // My Tracks
    Route::post('/tracks', [\App\Http\Controllers\TrackController::class, 'publish']); // Publish new
    Route::delete('/tracks/{id}', [\App\Http\Controllers\TrackController::class, 'destroy']);
    
    // Likes
    Route::post('/tracks/{id}/like', [\App\Http\Controllers\LikeController::class, 'toggleLike']);
    Route::get('/my-likes', [\App\Http\Controllers\LikeController::class, 'myLikes']);

    // Playlists
    Route::apiResource('playlists', PlaylistController::class);
    Route::post('/playlists/{id}/tracks', [PlaylistController::class, 'addTrack']);
    Route::delete('/playlists/{id}/tracks', [PlaylistController::class, 'removeTrack']);
});

// Public Track Routes
Route::get('/public-tracks', [\App\Http\Controllers\TrackController::class, 'publicIndex']);
Route::get('/users/{id}/tracks', [\App\Http\Controllers\TrackController::class, 'userTracks']);
Route::get('/search', [\App\Http\Controllers\TrackController::class, 'search']); // DB Search
Route::get('/tracks/random', [\App\Http\Controllers\TrackController::class, 'random']); 
Route::get('/hub', [\App\Http\Controllers\HubController::class, 'index']); // New Curated Hub Logic

// Artist Flow
Route::post('/auth/send-verification', [\App\Http\Controllers\ArtistController::class, 'sendVerification']);
Route::post('/auth/verify-code', [\App\Http\Controllers\ArtistController::class, 'verifyCode']);
Route::post('/artist/verify-and-upgrade', [\App\Http\Controllers\ArtistController::class, 'verifyAndUpgrade']);
Route::match(['put', 'post'], '/artist/profile', [\App\Http\Controllers\ArtistController::class, 'updateProfile'])->middleware('auth:sanctum');
Route::get('/artist/stats', [\App\Http\Controllers\ArtistController::class, 'getStats']);

// Public Artist Directory (Hub & Artist Page)
Route::get('/artists', [\App\Http\Controllers\ArtistController::class, 'index']);
Route::get('/artists/{slug}', [\App\Http\Controllers\ArtistController::class, 'show']);
Route::get('/artists/{slug}/tracks', [\App\Http\Controllers\ArtistController::class, 'tracks']);

Route::middleware(['web'])->group(function () {
    Route::get('/auth/google', [AuthController::class, 'redirectToGoogle']);
    Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);
    Route::get('/auth/facebook', [AuthController::class, 'redirectToFacebook']);
    Route::get('/auth/facebook/callback', [AuthController::class, 'handleFacebookCallback']);
});




Route::post('/analyze', [TrackController::class, 'analyze']);
Route::post('/publish', [TrackController::class, 'publish']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::put('/tracks/{id}', [TrackController::class, 'update']);
    Route::delete('/tracks/{id}', [TrackController::class, 'destroy']);
    
    // Like System
    Route::post('/tracks/{id}/like', [LikeController::class, 'toggleLike']);
    Route::get('/my-likes', [LikeController::class, 'myLikes']);

    // Playlists
    Route::get('/playlists', [PlaylistController::class, 'index']); // List my playlists
    Route::post('/playlists', [PlaylistController::class, 'store']); // Create
    Route::get('/playlists/{id}', [PlaylistController::class, 'show']); // View
    Route::put('/playlists/{id}', [PlaylistController::class, 'update']); // Update Settings
    Route::post('/playlists/{id}/tracks', [PlaylistController::class, 'addTrack']); // Add Track
    Route::delete('/playlists/{id}/tracks', [PlaylistController::class, 'removeTrack']); // Remove Track
});
