<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$track = \App\Models\Track::where('title', 'like', '%People Are Strange%')->first();

if ($track) {
    echo "Track ID: " . $track->id . "\n";
    echo "File Path: " . ($track->file_path ?? 'NULL') . "\n";
    echo "Abs File Path (Storage): " . storage_path('app/public/' . $track->file_path) . "\n";
    echo "Exists: " . (file_exists(storage_path('app/public/' . $track->file_path)) ? 'YES' : 'NO') . "\n";
} else {
    echo "Track not found.\n";
}
