<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mo_phans', function (Blueprint $table) {
            $table->string('anh_mo_path')->nullable()->after('ghi_chu');
            $table->string('anh_mo_disk', 50)->nullable()->after('anh_mo_path');
        });

        Schema::create('mo_phan_lich_sus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mo_phan_id')->constrained('mo_phans')->cascadeOnDelete();
            $table->foreignId('nguoi_cap_nhat_id')->nullable()->constrained('nguoi_dungs')->nullOnDelete();
            $table->decimal('vi_do_cu', 10, 7)->nullable();
            $table->decimal('kinh_do_cu', 10, 7)->nullable();
            $table->decimal('vi_do_moi', 10, 7)->nullable();
            $table->decimal('kinh_do_moi', 10, 7)->nullable();
            $table->text('ghi_chu_cu')->nullable();
            $table->text('ghi_chu_moi')->nullable();
            $table->string('anh_mo_cu')->nullable();
            $table->string('anh_mo_moi')->nullable();
            $table->timestamps();

            $table->index('mo_phan_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mo_phan_lich_sus');

        Schema::table('mo_phans', function (Blueprint $table) {
            $table->dropColumn(['anh_mo_path', 'anh_mo_disk']);
        });
    }
};
