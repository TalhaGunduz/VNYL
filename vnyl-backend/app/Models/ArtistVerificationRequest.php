<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArtistVerificationRequest extends Model
{
    use HasFactory;

    protected $fillable = ['artist_id', 'status', 'verification_code', 'expires_at'];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function artist()
    {
        return $this->belongsTo(Artist::class);
    }
}
