<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'dob',
        'gender',
        'google_id',
        'facebook_id',
        'avatar',
        'location',
        'role',
        'verification_code',
        'verification_code_expires_at',
        'verification_status',
        'primary_genre',
        'secondary_genres',
        'location_city',
        'location_country',
        'career_status',
        'social_instagram',
        'social_spotify',
        'social_youtube',
        'social_soundcloud',
        'social_apple',
        'stage_name',
        'artist_bio',
    ];

    // protected $casts removed in favor of casts() method

    public function artist()
    {
        return $this->hasOne(Artist::class);
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'verification_code_expires_at' => 'datetime',
            'secondary_genres' => 'array',
        ];
    }

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['joined_at', 'is_artist', 'is_verified', 'tracks_count', 'likes_count', 'followers_count', 'following_count'];

    /**
     * Get the user's joined date in a human readable format.
     */
    public function getJoinedAtAttribute(): string
    {
        return $this->created_at ? $this->created_at->format('F Y') : 'N/A';
    }

    /**
     * Determine if the user is an artist.
     */
    public function getIsArtistAttribute(): bool
    {
        return $this->role === 'artist';
    }

    /**
     * Determine if the user is verified.
     */
    public function getIsVerifiedAttribute(): bool
    {
        return $this->verification_status === 'verified';
    }

    /**
     * The tracks uploaded by the user.
     */
    public function tracks()
    {
        return $this->hasMany(Track::class);
    }

    /**
     * The tracks that the user has liked.
     */
    public function likes()
    {
        return $this->belongsToMany(Track::class, 'track_likes', 'user_id', 'track_id')->withTimestamps();
    }

    /**
     * Get the number of tracks uploaded by the user.
     */
    public function getTracksCountAttribute(): int
    {
        return $this->tracks()->count();
    }

    /**
     * Get the number of tracks liked by the user.
     */
    public function getLikesCountAttribute(): int
    {
        return $this->likes()->count();
    }

    public function playlists()
    {
        return $this->hasMany(Playlist::class);
    }

    /**
     * The users that follow this user.
     */
    public function followers()
    {
        return $this->belongsToMany(User::class, 'followers', 'following_id', 'follower_id')->withTimestamps();
    }

    /**
     * The users that this user follows.
     */
    public function following()
    {
        return $this->belongsToMany(User::class, 'followers', 'follower_id', 'following_id')->withTimestamps();
    }

    public function getFollowersCountAttribute(): int
    {
        return $this->followers()->count();
    }

    public function getFollowingCountAttribute(): int
    {
        return $this->following()->count();
    }
}
