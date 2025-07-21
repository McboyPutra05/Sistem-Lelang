<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
    Schema::table('items', function (Blueprint $table) {
        $table->unsignedBigInteger('winner_bid_id')->nullable()->after('end_date');
        $table->foreign('winner_bid_id')->references('id')->on('bids')->onDelete('set null');
    });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            //
        });
    }
};
