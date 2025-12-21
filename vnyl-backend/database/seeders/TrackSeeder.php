<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Track;
use App\Models\User;

class TrackSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure at least one user exists
        $user = User::firstOrCreate(
            ['email' => 'admin@vnyl.app'],
            [
                'name' => 'System Admin',
                'username' => 'system_admin',
                'password' => bcrypt('password'),
                'dob' => '2000-01-01',
                'gender' => 'Prefer not to say',
            ]
        );

        $tracks = [
            ['title' => 'Starboy', 'artist' => 'The Weeknd'],
            ['title' => 'Blinding Lights', 'artist' => 'The Weeknd'],
            ['title' => 'Money Trees', 'artist' => 'Kendrick Lamar'],
            ['title' => 'HUMBLE.', 'artist' => 'Kendrick Lamar'],
            ['title' => 'DNA.', 'artist' => 'Kendrick Lamar'],
            ['title' => 'Shut Up My Moms Calling', 'artist' => 'Hotel Ugly'],
            ['title' => 'Borderline', 'artist' => 'Tame Impala'],
            ['title' => 'The Less I Know The Better', 'artist' => 'Tame Impala'],
            ['title' => 'One More Time', 'artist' => 'Daft Punk'],
            ['title' => 'Instant Crush', 'artist' => 'Daft Punk'],
            ['title' => 'R U Mine?', 'artist' => 'Arctic Monkeys'],
            ['title' => 'Do I Wanna Know?', 'artist' => 'Arctic Monkeys'],
            ['title' => '505', 'artist' => 'Arctic Monkeys'],
            ['title' => 'No Surprises', 'artist' => 'Radiohead'],
            ['title' => 'Creep', 'artist' => 'Radiohead'],
            ['title' => 'Karma Police', 'artist' => 'Radiohead'],
            ['title' => 'Fluorescent Adolescent', 'artist' => 'Arctic Monkeys'],
            ['title' => 'Softcore', 'artist' => 'The Neighbourhood'],
            ['title' => 'Sweater Weather', 'artist' => 'The Neighbourhood'],
            ['title' => 'Daddy Issues', 'artist' => 'The Neighbourhood'],
            ['title' => 'After Hours', 'artist' => 'The Weeknd'],
            ['title' => 'Die For You', 'artist' => 'The Weeknd'],
            ['title' => 'Call Out My Name', 'artist' => 'The Weeknd'],
            ['title' => 'Pink + White', 'artist' => 'Frank Ocean'],
            ['title' => 'Nights', 'artist' => 'Frank Ocean'],
            ['title' => 'Chanel', 'artist' => 'Frank Ocean'],
            ['title' => 'Ivy', 'artist' => 'Frank Ocean'],
            ['title' => 'Self Control', 'artist' => 'Frank Ocean'],
            ['title' => 'Novacane', 'artist' => 'Frank Ocean'],
            ['title' => 'Lost', 'artist' => 'Frank Ocean'],
            ['title' => 'Time', 'artist' => 'Pink Floyd'],
            ['title' => 'Comfortably Numb', 'artist' => 'Pink Floyd'],
            ['title' => 'Wish You Were Here', 'artist' => 'Pink Floyd'],
        ];

        foreach ($tracks as $t) {
            Track::firstOrCreate(
                ['title' => $t['title'], 'featured_artist' => $t['artist']], // Uniqueness check
                [
                    'user_id' => $user->id,
                    'status' => 'published',
                    'file_path' => null, // Will depend on YouTube
                    'is_public' => true,
                ]
            );
        }
    }
}
