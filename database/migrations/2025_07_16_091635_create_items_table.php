<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->decimal('starting_price', 15, 2);
            $table->decimal('current_price', 15, 2);
            $table->string('image_url')->nullable();
            $table->timestamp('end_date');
            $table->enum('status', ['open', 'closed', 'sold'])->default('open');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('items');
    }
};