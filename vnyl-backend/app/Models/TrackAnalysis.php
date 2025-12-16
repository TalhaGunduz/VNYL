<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrackAnalysis extends Model
{
    protected $fillable = [
        'track_id', 
        'bpm', 
        'duration', 
        'energy', 
        'mood', 
        'loudness', 
        'key', 
        'tempo_class', 
        'primary_genre', 
        'genre_distribution'
    ];

    protected $casts = [
        'genre_distribution' => 'array',
    ];

    public function track()
    {
        return $this->belongsTo(Track::class);
    }
}
