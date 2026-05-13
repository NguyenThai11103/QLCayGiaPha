<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nguois', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_dong_ho')->constrained('dong_hos')->cascadeOnDelete();
            $table->string('ten_day_du');
            $table->string('gioi_tinh');
            $table->date('ngay_sinh')->nullable();
            $table->date('ngay_mat')->nullable();
            $table->boolean('da_mat')->default(false);
            $table->foreignId('id_cha')->nullable()->constrained('nguois')->nullOnDelete();
            $table->foreignId('id_me')->nullable()->constrained('nguois')->nullOnDelete();
            $table->text('tieu_su')->nullable();
            $table->string('anh_dai_dien')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nguois');
    }
};
