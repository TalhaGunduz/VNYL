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

        $tracks = Track::whereNull('youtube_video_id')
            ->orderBy('id', 'desc') // Process newest first? or oldest?
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
                    $track->youtube_video_id = $match['id'];
                    
                    // Optional: Update cover if missing
                    // if (!$track->cover_image && !$track->cover_path) {
                    //    $track->cover_image = $match['cover_image'];
                    // }
                    // Optional: Update duration if missing
                    
                    $track->save();
                    // $this->info(" Found: {$match['title']} ({$match['id']})");
                } else {
                     // $this->warn(" No match found for: {$query}");
                }

                // Rate limiting to be safe with YouTube API quota
                usleep(200000); // 0.2s pause

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
