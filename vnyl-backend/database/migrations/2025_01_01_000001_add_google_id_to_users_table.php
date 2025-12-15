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
            $table->string('google_id')->nullable()->after('email');
            $table->string('password')->nullable()->change();
            $table->date('dob')->nullable()->change();
            $table->enum('gender', ['Male', 'Female', 'Non-binary', 'Prefer not to say'])->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('google_id');
            // Reverting nullable changes depends on data integrity, omitting strict revert for simplicity in dev
            $table->string('password')->nullable(false)->change();
            $table->date('dob')->nullable(false)->change();
            $table->enum('gender', ['Male', 'Female', 'Non-binary', 'Prefer not to say'])->nullable(false)->change();
        });
    }
};
