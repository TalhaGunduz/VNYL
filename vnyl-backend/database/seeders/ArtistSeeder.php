<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Artist;
use App\Models\Track;
use App\Services\YouTubeService;
use Illuminate\Support\Str;

class ArtistSeeder extends Seeder
{
    protected $youtube;

    // Curated List
    protected $artists = [
        'Tame Impala' => ['The Less I Know The Better', 'Borderline', 'Let It Happen', 'New Person, Same Old Mistakes', 'Lost In Yesterday'],
        'Daft Punk' => ['Get Lucky', 'One More Time', 'Instant Crush', 'Harder, Better, Faster, Stronger', 'Starboy'],
        'Arctic Monkeys' => ['Do I Wanna Know?', 'R U Mine?', '505', 'Arabella', 'Why\'d You Only Call Me When You\'re High?'],
        'Radiohead' => ['Creep', 'Karma Police', 'No Surprises', 'High and Dry', 'Paranoid Android'],
        'The Weeknd' => ['Blinding Lights', 'The Hills', 'Starboy', 'Save Your Tears', 'Die For You'],
        'Pink Floyd' => ['Wish You Were Here', 'Comfortably Numb', 'Another Brick In The Wall', 'Time', 'Money'],
        'Kendrick Lamar' => ['HUMBLE.', 'DNA.', 'All The Stars', 'Swimming Pools', 'Money Trees']
    ];

    public function __construct(YouTubeService $youtube)
    {
        $this->youtube = $youtube;
    }

    public function run()
    {
        foreach ($this->artists as $artistName => $songs) {
            $this->command->info("Processing Artist: $artistName");

            // 1. Create/Find Artist (Normalization ensured via unique name)
            $artist = Artist::firstOrCreate(
                ['stage_name' => $artistName],
                [
                    'slug' => Str::slug($artistName),
                    'artist_bio' => "$artistName is a curated artist on VNYL.",
                    'avatar' => null // Will try to fill from first track
                ]
            );

            // 2. Sync Tracks
            foreach ($songs as $songTitle) {
                // Check if track exists
                $existing = Track::where('title', 'LIKE', "%$songTitle%")
                    ->where('featured_artist', 'LIKE', "%$artistName%")
                    ->first();

                if ($existing) {
                    // Update relation if missing
                    if (!$existing->artist_id) {
                        $existing->update(['artist_id' => $artist->id]);
                    }
                    continue; 
                }

                $this->command->info("  - Importing: $songTitle");
                
                // Import from YouTube
                $query = "$artistName - $songTitle";
                $match = $this->youtube->findBestMatch($query);

                if ($match) {
                    // Check if track exists by Video ID first to avoid Duplicates
                    $trackByVideo = Track::where('youtube_video_id', $match['id'])->first();

                    if ($trackByVideo) {
                        // Link and continue
                        if (!$trackByVideo->artist_id) {
                            $trackByVideo->update(['artist_id' => $artist->id]);
                        }
                        continue;
                    }

                    // Create Track
                    $track = Track::create([
                        'user_id' => 1,
                        'title' => $match['title'], 
                        'featured_artist' => $artistName, // ENFORCE CLEAN NAME
                        'artist_id' => $artist->id, // LINK RELATION
                        'youtube_video_id' => $match['id'],
                        'cover_image' => $match['cover_image'],
                        'duration' => 180, // Approximate/Default if detailed fetch skipped
                        'status' => 'published',
                        'is_public' => true
                    ]);

                    // Update artist image if empty
                    if (!$artist->avatar && $match['cover_image']) {
                        $artist->update(['avatar' => $match['cover_image']]);
                    }
                }
                
                // Sleep specifically to avoid rate limits if running many
                sleep(1);
            }
        }
    }
}
