<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tracks', function (Blueprint $table) {
            $table->dropUnique(['youtube_video_id']);
            // If the index name is different, we might need to specify it. 
            // Default is usually table_column_unique.
            // Based on error log: 'tracks_youtube_video_id_unique'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tracks', function (Blueprint $table) {
            $table->unique('youtube_video_id');
        });
    }
};
