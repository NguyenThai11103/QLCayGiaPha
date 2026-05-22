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
        Schema::table('dong_hos', function (Blueprint $table) {
            $table->boolean('trang_thai')->default(true)->after('dia_chi_tu_duong')->comment('true: hoạt động, false: bị khóa');
        });

        Schema::table('nguoi_dungs', function (Blueprint $table) {
            $table->boolean('trang_thai')->default(true)->after('quyen_han')->comment('true: hoạt động, false: bị khóa');
            $table->string('trang_thai_gia_nhap', 50)->default('da_duyet')->after('trang_thai')->comment('cho_duyet, da_duyet, tu_choi');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('nguoi_dungs', function (Blueprint $table) {
            $table->dropColumn(['trang_thai', 'trang_thai_gia_nhap']);
        });

        Schema::table('dong_hos', function (Blueprint $table) {
            $table->dropColumn('trang_thai');
        });
    }
};
