<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('thanh_viens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dong_ho_id')->constrained('dong_hos')->cascadeOnDelete();
            $table->string('ho_ten');
            $table->string('ten_thuong_goi')->nullable();
            $table->string('gioi_tinh', 10);
            $table->integer('thu_tu_sinh')->nullable();
            $table->integer('doi_thu')->nullable();
            $table->integer('tinh_trang_song')->default(1);
            $table->date('ngay_sinh_duong')->nullable();
            $table->date('ngay_sinh_am')->nullable();
            $table->integer('nam_sinh_uoc_tinh')->nullable();
            $table->date('ngay_mat_am')->nullable();
            $table->string('anh_dai_dien')->nullable();
            $table->string('nghe_nghiep')->nullable();
            $table->string('dia_chi')->nullable();
            $table->string('cho_o_hien_tai')->nullable();
            $table->text('tieu_su')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('thanh_viens');
    }
};
