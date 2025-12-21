<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Track;
use App\Models\User;

class VnylSelectionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure User 1 exists and is named VNYL (already done, but safe to check/mock)
        $vnylUser = User::find(1);
        if (!$vnylUser) {
            $vnylUser = User::create([
                'id' => 1,
                'name' => 'VNYL',
                'email' => 'vnyl@vnyl.com',
                'password' => bcrypt('password'),
                'role' => 'artist'
            ]);
        }

        $tracks = [
            // Jamie Duffy
            [
                'title' => 'Rising',
                'artist' => 'Jamie Duffy',
                'video_id' => 'vP9z1g6_y0s',
                'duration' => 180 // Estimated
            ],
            [
                'title' => 'Solas',
                'artist' => 'Jamie Duffy',
                'video_id' => 'f0mI_2wYF_8',
                'duration' => 200
            ],
            [
                'title' => 'Resonance',
                'artist' => 'Jamie Duffy',
                'video_id' => 'X-sT-h2G21k',
                'duration' => 210
            ],
            [
                'title' => 'Into The West',
                'artist' => 'Jamie Duffy',
                'video_id' => 'a73S0lZfV1w',
                'duration' => 195
            ],

            // Rio Romeo
            [
                'title' => "Nothing's New",
                'artist' => 'Rio Romeo',
                'video_id' => '5e4INH1yr9c',
                'duration' => 165
            ],
            [
                'title' => 'Butch 4 Butch',
                'artist' => 'Rio Romeo',
                'video_id' => 'SdX_9vIuSG4',
                'duration' => 170
            ],
            [
                'title' => 'Inarticulation',
                'artist' => 'Rio Romeo',
                'video_id' => 'aY4Z4d9K2bM',
                'duration' => 185
            ],
            [
                'title' => "Nothing's New (Sped Up)",
                'artist' => 'Rio Romeo',
                'video_id' => 'E5W_y8fP0Lw',
                'duration' => 140
            ]
        ];

        foreach ($tracks as $t) {
            Track::firstOrCreate(
                ['youtube_video_id' => $t['video_id']],
                [
                    'user_id' => 1, // VNYL
                    'title' => $t['title'],
                    'featured_artist' => $t['artist'],
                    'cover_image' => "https://img.youtube.com/vi/{$t['video_id']}/maxresdefault.jpg",
                    'duration' => $t['duration'],
                    'status' => 'published',
                    'is_public' => true
                ]
            );
        }
    }
}
