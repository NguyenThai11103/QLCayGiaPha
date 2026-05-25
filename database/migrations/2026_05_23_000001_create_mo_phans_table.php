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
            $table->foreignId('nguoi_cap_nhat_id')->nullable()->constrained('nguoi_dungs')->nullOnDelete();
            $table->timestamps();

            $table->index('dong_ho_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mo_phans');
    }
};
