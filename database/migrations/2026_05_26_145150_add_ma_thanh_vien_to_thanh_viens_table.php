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
        Schema::table('thanh_viens', function (Blueprint $table) {
            $table->string('ma_thanh_vien')->unique()->nullable()->after('id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('thanh_viens', function (Blueprint $table) {
            $table->dropColumn('ma_thanh_vien');
        });
    }
};
