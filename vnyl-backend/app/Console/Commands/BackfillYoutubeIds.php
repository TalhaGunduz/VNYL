<?php

namespace App\Console\Commands;

use App\Models\Track;
use App\Services\YouTubeService;
use Illuminate\Console\Command;

class BackfillYoutubeIds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:backfill-youtube {--limit=50 : Max number of tracks to process}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Find and save YouTube Video IDs for tracks that are missing them';

    /**
     * Execute the console command.
     */
    public function handle(YouTubeService $youtube)
    {
        $limit = $this->option('limit');
        $this->info("Backfilling YouTube IDs for up to {$limit} tracks...");

        $tracks = Track::query()
            ->whereNull('youtube_video_id')
            ->orWhereNull('cover_image')
            ->orWhereNull('duration')
            ->orderBy('id', 'desc')
            ->limit($limit)
            ->get();

        if ($tracks->isEmpty()) {
            $this->info("No tracks found needing backfill.");
            return;
        }

        $bar = $this->output->createProgressBar(count($tracks));
        $bar->start();

        foreach ($tracks as $track) {
            $query = $track->featured_artist . ' - ' . $track->title;
            // $this->line(" Searching for: {$query}");

            try {
                // Use findBestMatch from Service
                $match = $youtube->findBestMatch($query);

                if ($match && isset($match['id'])) {
                    // Check if another track already uses this ID (to avoid unique constraint violation)
                    $existing = Track::where('youtube_video_id', $match['id'])->where('id', '!=', $track->id)->first();
                    if ($existing) {
                        // If separate track has same video, it's fine, but unique constraint blocks it.
                        // Actually, if we have a unique constraint, we can't share IDs.
                        // But wait, why unique? Multiple tracks can share same video (e.g. slight metadata diff).
                        // If schema enforces unique, we must skip or handle.
                        // For now, let's just use the ID. If it fails, catch it.
                    }

                    $track->youtube_video_id = $match['id'];
                    
                    // Fetch details for duration and high-res cover
                    $details = $youtube->getVideoDetails($match['id']);
                        
                    if (isset($details['items'][0])) {
                        $item = $details['items'][0];
                            
                        // Update Cover - Force update if current is low res default or missing
                        // Logic: If we have a new cover from Details, prefer it.
                        $thumbnails = $item['snippet']['thumbnails'] ?? [];
                        $newCover = $thumbnails['maxres']['url'] ?? 
                                    $thumbnails['standard']['url'] ?? 
                                    $thumbnails['high']['url'] ?? 
                                    $match['cover_image'];
                                    
                        if (!$track->cover_image && !$track->cover_path) {
                             $track->cover_image = $newCover;
                        }

                        // Update Duration
                        // ... (same duration logic)
                            if (!$track->duration && isset($item['contentDetails']['duration'])) {
                                try {
                                    $interval = new \DateInterval($item['contentDetails']['duration']);
                                    $seconds = ($interval->h * 3600) + ($interval->i * 60) + $interval->s;
                                    $track->duration = $seconds;
                                } catch (\Exception $e) {
                                    // Ignore parse error
                                }
                            }
                        } else {
                             // Fallback if details fail but we have match
                             if (!$track->cover_image) $track->cover_image = $match['cover_image'];
                        }
                        
                        $track->save();
                    // $this->info(" Found: {$match['title']} ({$match['id']})");
                } else {
                     // $this->warn(" No match found for: {$query}");
                }

                // Rate limiting to be safe with YouTube API quota
                usleep(200000); // 0.2s pause

            } catch (\Illuminate\Database\QueryException $e) {
                if ($e->errorInfo[1] == 1062) {
                     // Duplicate entry for key 'tracks_youtube_video_id_unique'
                     // Just ignore and move on, or maybe clear the ID if it's invalid?
                     // Verify if we can just update cover/duration without touching ID if ID is already set?
                     // Re-loading track might help?
                     $this->warn(" Duplicate ID for track {$track->id}. Skipping ID update.");
                } else {
                    $this->error(" Database Error processing {$track->id}: " . $e->getMessage());
                }
            } catch (\Exception $e) {
                $this->error(" Error processing {$track->id}: " . $e->getMessage());
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Backfill complete.");
    }
}
