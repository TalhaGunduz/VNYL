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
        Schema::create('track_analyses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('track_id')->constrained()->onDelete('cascade');
            $table->float('bpm')->nullable();
            $table->float('duration')->nullable();
            $table->float('energy')->nullable();
            $table->string('mood')->nullable();
            $table->float('loudness')->nullable();
            $table->string('key')->nullable();
            $table->string('tempo_class')->nullable();
            $table->string('primary_genre')->nullable();
            $table->json('genre_distribution')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('track_analyses');
    }
};
