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
            $table->string('logo_path')->nullable()->after('ten_dong_ho');
            $table->string('anh_tu_duong_path')->nullable()->after('dia_chi_tu_duong');
            $table->text('gia_huan')->nullable()->after('mo_ta');
            $table->text('loi_gioi_thieu')->nullable()->after('gia_huan');
            $table->string('theme_color', 50)->default('gold')->after('nguoi_tao');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dong_hos', function (Blueprint $table) {
            $table->dropColumn(['logo_path', 'anh_tu_duong_path', 'gia_huan', 'loi_gioi_thieu', 'theme_color']);
        });
    }
};
