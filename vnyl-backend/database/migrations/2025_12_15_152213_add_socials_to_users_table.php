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
        Schema::table('users', function (Blueprint $table) {
            $table->string('social_instagram')->nullable()->after('career_status');
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
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'social_instagram',
                'social_spotify',
                'social_youtube',
                'social_soundcloud',
                'social_apple',
            ]);
        });
    }
};
