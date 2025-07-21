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
        // Menambahkan semua kolom yang hilang setelah kolom 'email'
        $table->string('address')->nullable()->after('email');
        $table->string('ktp', 20)->nullable()->after('address');
        $table->text('bio')->nullable()->after('ktp');
        $table->string('photo')->nullable()->after('bio');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['address', 'ktp', 'bio']);
        });
    }
};