<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('thanh_viens', 'ma_thanh_vien')) {
            Schema::table('thanh_viens', function (Blueprint $table) {
                $table->string('ma_thanh_vien')->unique()->nullable()->after('id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('thanh_viens', 'ma_thanh_vien')) {
            Schema::table('thanh_viens', function (Blueprint $table) {
                $table->dropColumn('ma_thanh_vien');
            });
        }
    }
};
