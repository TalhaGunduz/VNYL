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
        Schema::create('artist_daily_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('artist_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->bigInteger('plays')->default(0); // New plays this day
            $table->integer('listeners')->default(0); // Unique listeners this day (future proofing)
            $table->integer('followers_snapshot')->default(0); // Total followers at end of day
            $table->timestamps();

            $table->unique(['artist_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('artist_daily_stats');
    }
};
