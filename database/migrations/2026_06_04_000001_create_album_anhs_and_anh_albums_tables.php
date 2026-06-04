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
        Schema::create('album_anhs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dong_ho_id')->constrained('dong_hos')->onDelete('cascade');
            $table->string('ten_album');
            $table->string('loai_album'); // 'tu_duong', 'hop_ho', 'gioi_to', 'mo_phan', 'tu_lieu'
            $table->integer('nam');
            $table->text('mo_ta')->nullable();
            $table->foreignId('nguoi_tao_id')->nullable()->constrained('nguoi_dungs')->onDelete('set null');
            $table->timestamps();
        });

        Schema::create('anh_albums', function (Blueprint $table) {
            $table->id();
            $table->foreignId('album_id')->constrained('album_anhs')->onDelete('cascade');
            $table->string('duong_dan_file');
            $table->string('path');
            $table->string('disk');
            $table->string('caption')->nullable();
            $table->foreignId('nguoi_tai_len_id')->nullable()->constrained('nguoi_dungs')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('anh_albums');
        Schema::dropIfExists('album_anhs');
    }
};
