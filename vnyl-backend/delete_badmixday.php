<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Track;
use App\Models\User;
use App\Models\Artist;

try {
    echo "Searching for Badmixday tracks...\n";
    
    // Find by Name just to be sure we have the right ID
    $artistUser = User::where('name', 'Badmixday')->orWhere('stage_name', 'Badmixday')->first();
    $id = $artistUser ? $artistUser->id : 12; // Fallback to 12 if not found by name, but 12 is hardcoded in seeder
    
    echo "Targeting Artist ID: $id\n";
    
    $query = Track::where('artist_id', $id)
                  ->orWhere('user_id', $id)
                  ->orWhere('featured_artist', 'Badmixday');
                  
    $count = $query->count();
    
    if ($count > 0) {
        $deleted = $query->delete();
        echo "[SUCCESS] Deleted $deleted tracks belonging to Badmixday.\n";
    } else {
        echo "[INFO] No tracks found for Badmixday.\n";
    }

} catch (\Exception $e) {
    echo "[ERROR] " . $e->getMessage() . "\n";
}
