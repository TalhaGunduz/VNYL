<?php


use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user()->load('artist');
    });
    Route::match(['put', 'post'], '/update-profile', [AuthController::class, 'updateProfile']);
    Route::delete('/delete-account', [AuthController::class, 'deleteAccount']);
});

// Artist Flow
Route::post('/auth/send-verification', [\App\Http\Controllers\ArtistController::class, 'sendVerification']);
Route::post('/auth/verify-code', [\App\Http\Controllers\ArtistController::class, 'verifyCode']);
Route::post('/artist/verify-and-upgrade', [\App\Http\Controllers\ArtistController::class, 'verifyAndUpgrade']);
Route::match(['put', 'post'], '/artist/profile', [\App\Http\Controllers\ArtistController::class, 'updateProfile'])->middleware('auth:sanctum');
Route::get('/artist/stats', [\App\Http\Controllers\ArtistController::class, 'getStats']);

Route::middleware(['web'])->group(function () {
    Route::get('/auth/google', [AuthController::class, 'redirectToGoogle']);
    Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);
});

Route::get('/tracks', function () {
    return response()->json([
        ['id' => 1, 'title' => 'Neon Dreams', 'artist' => 'Luna Waves', 'gradient' => 'from-[#1f1f1f] via-[#2b2b2b] to-[#3a3a3a]'],
        ['id' => 2, 'title' => 'Midnight Echoes', 'artist' => 'Caspian Vale', 'gradient' => 'from-[#2a1f14] via-[#3b2a1f] to-[#4b372a]'],
        ['id' => 3, 'title' => 'Quiet Streets', 'artist' => 'Vesper', 'gradient' => 'from-[#1a202c] via-[#222b3a] to-[#2d3a4a]'],
        ['id' => 4, 'title' => 'Static Sun', 'artist' => 'Amberline', 'gradient' => 'from-[#241a1a] via-[#2f2222] to-[#3a2b2b]'],
        ['id' => 5, 'title' => 'Glass Birds', 'artist' => 'Mira', 'gradient' => 'from-[#1a1f24] via-[#222a30] to-[#2a3540]'],
        ['id' => 6, 'title' => 'Signal Fire', 'artist' => 'Kite Club', 'gradient' => 'from-[#1b1b1b] via-[#282828] to-[#353535]'],
        ['id' => 7, 'title' => 'Soft Bloom', 'artist' => 'Juniper', 'gradient' => 'from-[#1e1a24] via-[#2a2230] to-[#352a3d]'],
        ['id' => 8, 'title' => 'Over Water', 'artist' => 'Kepler', 'gradient' => 'from-[#1a2420] via-[#223028] to-[#2a3d34]'],
    ]);
});