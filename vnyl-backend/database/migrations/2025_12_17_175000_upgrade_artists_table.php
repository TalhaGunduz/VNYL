<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('artists', function (Blueprint $table) {
            // Add 'slug' for URL friendly names
            $table->string('slug')->nullable()->unique();
            
            // Allow 'user_id' to be nullable (for curated/system artists)
            $table->unsignedBigInteger('user_id')->nullable()->change();

            // Ensure we have a general 'image_url' or map to 'avatar'
            // The existing table has 'avatar'. We can keep using it.
            // stage_name is effectively 'name'.
        });
    }

    public function down()
    {
        Schema::table('artists', function (Blueprint $table) {
            $table->dropColumn('slug');
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
        });
    }
};
