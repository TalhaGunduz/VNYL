<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Track extends Model
{
    protected $fillable = ['user_id', 'title', 'file_path', 'cover_path', 'status', 'featured_artist'];

    public function analysis()
    {
        return $this->hasOne(TrackAnalysis::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
