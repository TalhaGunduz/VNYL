<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrackDailyStat extends Model
{
    protected $fillable = ['track_id', 'date', 'plays'];
}
