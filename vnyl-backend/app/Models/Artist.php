<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Artist extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'is_verified',
        'stage_name',
        'artist_bio',
        'bio', // Legacy
        'primary_genre',
        'secondary_genres',
        'career_status',
        'location_city',
        'location_country',
        'instagram_handle', // Legacy
        'spotify_id',       // Legacy
        'social_instagram',
        'social_spotify',
        'social_youtube',
        'social_soundcloud',
        'social_apple',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'secondary_genres' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function verificationRequests()
    {
        return $this->hasMany(ArtistVerificationRequest::class);
    }
}
