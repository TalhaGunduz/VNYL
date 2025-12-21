<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Track;

try {
    $count = Track::count();
    $published = Track::where('status', 'published')->count();
    echo "------------------------------------------------\n";
    echo "TOTAL TRACKS IN DB: " . $count . "\n";
    echo "PUBLISHED TRACKS  : " . $published . "\n";
    echo "------------------------------------------------\n";
    
    // List first 5 and last 5 to confirm variety
    echo "First 5:\n";
    foreach(Track::take(5)->get() as $t) echo " - " . $t->title . " (" . $t->id . ")\n";
    
    echo "Last 5:\n";
    foreach(Track::latest()->take(5)->get() as $t) echo " - " . $t->title . " (" . $t->id . ")\n";

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage();
}
