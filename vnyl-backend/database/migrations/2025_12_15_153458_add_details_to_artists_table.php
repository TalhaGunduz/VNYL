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
        Schema::table('artists', function (Blueprint $table) {
            $table->string('primary_genre')->nullable()->after('stage_name');
            $table->json('secondary_genres')->nullable()->after('primary_genre');
            $table->string('career_status')->nullable()->after('secondary_genres');
            $table->string('location_city')->nullable()->after('career_status');
            $table->string('location_country')->nullable()->after('location_city');
            
            // Socials
            $table->string('social_instagram')->nullable()->after('location_country');
            $table->string('social_spotify')->nullable()->after('social_instagram');
            $table->string('social_youtube')->nullable()->after('social_spotify');
            $table->string('social_soundcloud')->nullable()->after('social_youtube');
            $table->string('social_apple')->nullable()->after('social_soundcloud');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('artists', function (Blueprint $table) {
            $table->dropColumn([
                'primary_genre',
                'secondary_genres',
                'career_status',
                'location_city',
                'location_country',
                'social_instagram',
                'social_spotify',
                'social_youtube',
                'social_soundcloud',
                'social_apple',
            ]);
        });
    }
};
