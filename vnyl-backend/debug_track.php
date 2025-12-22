<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$track = \App\Models\Track::where('title', 'like', '%People Are Strange%')->first();

if ($track) {
    echo "Track ID: " . $track->id . "\n";
    echo "Title: " . $track->title . "\n";
    echo "Cover Image: " . ($track->cover_image ?? 'NULL') . "\n";
    echo "Cover Path: " . ($track->cover_path ?? 'NULL') . "\n";
    echo "YouTube ID: " . ($track->youtube_video_id ?? 'NULL') . "\n";
    echo "User ID: " . $track->user_id . "\n";
} else {
    echo "Track not found.\n";
}

$allTracks = \App\Models\Track::take(5)->get();
echo "\n--- First 5 Tracks ---\n";
foreach($allTracks as $t) {
    echo "ID: {$t->id} | Title: {$t->title} | CoverImg: " . substr($t->cover_image ?? '', 0, 30) . "... | CoverPath: {$t->cover_path}\n";
}
