<?php

namespace Database\Seeders;

use App\Models\Track;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class MusicImportSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Starting Music Import...');

        // 1. Clear existing tracks and related data from database
        $this->command->info('Clearing existing tracks and related data...');
        \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();
        \Illuminate\Support\Facades\DB::table('playlist_track')->truncate();
        \Illuminate\Support\Facades\DB::table('track_likes')->truncate(); 
        
        // Clear Users and Artists
        \Illuminate\Support\Facades\DB::table('artist_verification_requests')->truncate();
        \Illuminate\Support\Facades\DB::table('artists')->truncate();
        \Illuminate\Support\Facades\DB::table('users')->truncate();

        Track::truncate();
        \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();

        // 2. Clear existing files from storage
        $this->command->info('Clearing existing files from storage...');
        $publicTracksPath = storage_path('app/public/tracks');
        $publicCoversPath = storage_path('app/public/covers');
        $publicAvatarsPath = storage_path('app/public/avatars');

        // Cleanup directories
        if (File::exists($publicTracksPath)) File::cleanDirectory($publicTracksPath);
        else File::makeDirectory($publicTracksPath, 0755, true);

        if (File::exists($publicCoversPath)) File::cleanDirectory($publicCoversPath);
        else File::makeDirectory($publicCoversPath, 0755, true);

        if (File::exists($publicAvatarsPath)) File::cleanDirectory($publicAvatarsPath);
        else File::makeDirectory($publicAvatarsPath, 0755, true);

        // 3. Define source directories
        $sourceDirs = [
            base_path('../YouTube_Archiver_Pack'),
            base_path('../Badmixday - Topic - [ARCHIVED]')
        ];

        // Create Badmixday Artist
        $this->command->info('Creating Badmixday Artist...');
        
        $avatarPath = null;
        $sourceAvatar = base_path('../Badmixday - Topic - [ARCHIVED]/NA - Uploads from Badmixday - Topic [UUl1uqtTL-jkhJknsvv8NGFA].jpg');
        
        if (File::exists($sourceAvatar)) {
            $avatarFilename = 'badmixday_avatar.jpg';
            File::copy($sourceAvatar, $publicAvatarsPath . '/' . $avatarFilename);
            $avatarPath = 'avatars/' . $avatarFilename;
        }

        $user = User::create([
            'name' => 'Badmixday',
            'username' => 'badmixday',
            'email' => 'badmixday@vnyl.com',
            'password' => bcrypt('password'),
            'dob' => '2000-01-01',
            'gender' => 'Prefer not to say',
            'role' => 'artist',
            'stage_name' => 'Badmixday',
            'artist_bio' => 'Official Badmixday on VNYL.',
            'social_youtube' => 'https://www.youtube.com/@badmixday5147',
            'avatar' => $avatarPath,
        ]);

        // Create Artist record
        $artist = \App\Models\Artist::create([
            'user_id' => $user->id,
            'stage_name' => 'Badmixday',
            'slug' => 'badmixday',
            'avatar' => $avatarPath,
            'bio' => 'Official Badmixday on VNYL.',
            'is_verified' => true
        ]);

        foreach ($sourceDirs as $sourceDir) {
            if (!File::exists($sourceDir)) {
                $this->command->warn("Source directory not found: $sourceDir");
                continue;
            }

            $this->command->info("Processing directory: $sourceDir");
            $files = File::allFiles($sourceDir);

            foreach ($files as $file) {
                // Filter for audio files (mp3, wav, etc.) and MP4 videos
                $extension = strtolower($file->getExtension());
                if (!in_array($extension, ['mp3', 'wav', 'm4a', 'flac', 'mp4'])) {
                    continue;
                }

                $filename = $file->getFilename();
                $uniqueId = uniqid();
                $targetFilename = $uniqueId . '_' . $filename;
                $targetPath = $publicTracksPath . '/' . $targetFilename;
                
                // Copy file
                File::copy($file->getPathname(), $targetPath);

                // Create DB record
                // Clean up title (remove extension and common artifacts)
                $title = pathinfo($filename, PATHINFO_FILENAME);
                
                // Remove date prefix (e.g. 20230526 - )
                $title = preg_replace('/^\d{8}\s*-\s*/', '', $title);
                
                // Remove YouTube ID suffix (e.g. [UdNrtjxmbek])
                $title = preg_replace('/\[[^\]]+\]$/', '', $title);
                
                // Simple cleanup logic - customize as needed
                $title = str_replace(['[Topic]', '(Official Audio)', '(Official Archive)'], '', $title);
                $title = trim($title);

                $coverPath = null;
                // Extract Cover if file is MP4
                if ($extension === 'mp4') {
                    $coverFilename = $uniqueId . '.jpg';
                    $targetCoverPath = $publicCoversPath . '/' . $coverFilename;
                    
                    // FFMPEG command to extract frame at 1 second
                    // -i input -ss start_time -vframes 1 output
                    $ffmpegCmd = "ffmpeg -i " . escapeshellarg($targetPath) . " -ss 00:00:01 -vframes 1 " . escapeshellarg($targetCoverPath) . " -y 2>&1";
                    
                    exec($ffmpegCmd, $output, $returnVar);
                    
                    if ($returnVar === 0 && File::exists($targetCoverPath)) {
                         $coverPath = 'covers/' . $coverFilename;
                    } else {
                         $this->command->warn("Failed to extract cover for: $title");
                    }
                }

                Track::create([
                    'user_id' => $user->id,
                    'artist_id' => $artist->id,
                    'featured_artist' => 'Badmixday',
                    'title' => $title,
                    'file_path' => 'tracks/' . $targetFilename,
                    'cover_path' => $coverPath, 
                    'status' => 'published',
                    'is_public' => true,
                    // 'duration' => 0, 
                ]);

                $this->command->info("Imported: $title");
            }
        }

        $this->command->info('Music Import Completed!');
    }
}
