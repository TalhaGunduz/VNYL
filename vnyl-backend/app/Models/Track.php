<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Track extends Model
{
    protected $fillable = [
        'user_id', 
        'title', 
        'file_path', 
        'cover_path', 
        'status', 
        'featured_artist',
        'youtube_video_id',
        'cover_image',
        'duration',
        'is_public',
        'artist_id',
        'plays',
        'description'
    ];
    
    protected $casts = [
        'is_public' => 'boolean',
        'duration' => 'integer'
    ];

    public function analysis()
    {
        return $this->hasOne(TrackAnalysis::class);
    }

    protected $appends = ['is_liked', 'likes_count'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function artist()
    {
        return $this->belongsTo(Artist::class);
    }

    public function likedBy()
    {
        return $this->belongsToMany(User::class, 'track_likes', 'track_id', 'user_id')->withTimestamps();
    }

    public function getIsLikedAttribute()
    {
        // Check if user is logged in and has liked this track
        if (auth('sanctum')->check()) {
            return $this->likedBy()->where('user_id', auth('sanctum')->id())->exists();
        }
        return false;
    }

    public function getLikesCountAttribute()
    {
        return $this->likedBy()->count();
    }
}
