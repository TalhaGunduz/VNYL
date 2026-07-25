<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ArtistDailyStat extends Model
{
    protected $fillable = ['artist_id', 'date', 'plays', 'listeners', 'followers_snapshot'];
    public $timestamps = true;
}
