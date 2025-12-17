<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Artist extends Model
{
    use HasFactory;

    protected $fillable = [
        'stage_name', // Mapped to 'name' logically
        'slug',
        'avatar', // Mapped from 'image_url'
        'artist_bio', // Mapped from 'bio'
        'user_id'
    ];

    // Accessors for cleaner API usage
    public function getNameAttribute() {
        return $this->stage_name;
    }

    public function getImageUrlAttribute() {
        return $this->avatar;
    }

    public function tracks()
    {
        return $this->hasMany(Track::class);
    }
}
