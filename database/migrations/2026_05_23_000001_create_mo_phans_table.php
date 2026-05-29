<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mo_phans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dong_ho_id')->constrained('dong_hos')->cascadeOnDelete();
            $table->foreignId('thanh_vien_id')->unique()->constrained('thanh_viens')->cascadeOnDelete();
            $table->decimal('vi_do', 10, 7);
            $table->decimal('kinh_do', 10, 7);
            $table->text('ghi_chu')->nullable();
            $table->string('anh_mo_path')->nullable();
            $table->string('anh_mo_disk', 50)->nullable();
            $table->foreignId('nguoi_cap_nhat_id')->nullable()->constrained('nguoi_dungs')->nullOnDelete();
            $table->timestamps();

            $table->index('dong_ho_id');
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
        Schema::dropIfExists('mo_phans');
    }
};
