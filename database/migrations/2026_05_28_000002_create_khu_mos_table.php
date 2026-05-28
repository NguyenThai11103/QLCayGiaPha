<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('khu_mos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dong_ho_id')->constrained('dong_hos')->cascadeOnDelete();
            $table->string('ten_khu_mo');
            $table->string('dia_chi')->nullable();
            $table->decimal('vi_do', 10, 7);
            $table->decimal('kinh_do', 10, 7);
            $table->text('mo_ta')->nullable();
            $table->string('anh_khu_mo_path')->nullable();
            $table->string('anh_khu_mo_disk', 50)->nullable();
            $table->foreignId('nguoi_cap_nhat_id')->nullable()->constrained('nguoi_dungs')->nullOnDelete();
            $table->timestamps();

            $table->index('dong_ho_id');
        });

        Schema::table('mo_phans', function (Blueprint $table) {
            $table->foreignId('khu_mo_id')->nullable()->after('thanh_vien_id')->constrained('khu_mos')->nullOnDelete();
            $table->index('khu_mo_id');
        });
    }

    public function down(): void
    {
        Schema::table('mo_phans', function (Blueprint $table) {
            $table->dropForeign(['khu_mo_id']);
            $table->dropIndex(['khu_mo_id']);
            $table->dropColumn('khu_mo_id');
        });

        Schema::dropIfExists('khu_mos');
    }
};
