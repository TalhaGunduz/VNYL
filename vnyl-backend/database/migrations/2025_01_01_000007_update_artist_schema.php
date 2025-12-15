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
            $table->string('verification_code', 6)->nullable();
            $table->timestamp('verification_code_expires_at')->nullable();
            $table->string('verification_status', 50)->default('unverified')->after('role'); // unverified, pending, verified
        });

        Schema::table('artists', function (Blueprint $table) {
            $table->string('stage_name', 100)->nullable()->after('user_id');
            $table->text('artist_bio')->nullable()->after('bio'); // Renaming or adding alias if needed, user said artist_bio
            $table->string('instagram_handle', 100)->nullable();
            $table->string('spotify_id', 100)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['verification_code', 'verification_code_expires_at', 'verification_status']);
        });

        Schema::table('artists', function (Blueprint $table) {
            $table->dropColumn(['stage_name', 'artist_bio', 'instagram_handle', 'spotify_id']);
        });
    }
};
