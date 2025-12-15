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
            $table->string('primary_genre')->nullable()->after('verification_status');
            $table->json('secondary_genres')->nullable()->after('primary_genre');
            $table->string('location_city')->nullable()->after('secondary_genres');
            $table->string('location_country')->nullable()->after('location_city');
            $table->string('career_status')->nullable()->after('location_country');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'primary_genre',
                'secondary_genres',
                'location_city',
                'location_country',
                'career_status'
            ]);
        });
    }
};
