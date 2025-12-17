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
            // Make file_path nullable because YouTube tracks don't have a local file
            $table->string('file_path')->nullable()->change();
            
            // YouTube specific fields
            $table->string('youtube_video_id')->nullable()->unique()->after('user_id');
            $table->string('cover_image')->nullable()->after('cover_path'); // URL from YouTube
            $table->integer('duration')->nullable()->after('cover_image'); // In seconds
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tracks', function (Blueprint $table) {
            $table->string('file_path')->nullable(false)->change();
            $table->dropColumn(['youtube_video_id', 'cover_image', 'duration']);
        });
    }
};
