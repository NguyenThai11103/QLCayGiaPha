<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tai_lieus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dong_ho_id')->nullable()->constrained('dong_hos')->nullOnDelete();
            $table->foreignId('thanh_vien_id')->nullable()->constrained('thanh_viens')->nullOnDelete();
            $table->string('ten_tai_lieu')->nullable();
            $table->text('mo_ta')->nullable();
            $table->string('duong_dan_file');
            $table->string('ten_file_goc')->nullable();
            $table->string('loai_file', 50);
            $table->string('mime_type', 100)->nullable();
            $table->unsignedBigInteger('kich_thuoc')->nullable();
            $table->string('disk', 50)->nullable();
            $table->string('path')->nullable();
            $table->foreignId('nguoi_tai_len_id')->nullable()->constrained('nguoi_dungs')->nullOnDelete();
            $table->text('du_lieu_orc')->nullable();
            $table->timestamps();

            $table->index(['dong_ho_id', 'loai_file']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tai_lieus');
    }
};
