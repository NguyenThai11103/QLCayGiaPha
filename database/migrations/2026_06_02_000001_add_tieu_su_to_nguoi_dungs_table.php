<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('nguoi_dungs', function (Blueprint $table) {
            $table->text('tieu_su')->nullable()->after('avatar');
        });
    }

    public function down(): void
    {
        Schema::table('nguoi_dungs', function (Blueprint $table) {
            $table->dropColumn('tieu_su');
        });
    }
};
