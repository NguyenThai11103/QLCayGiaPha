<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nguoi_dungs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dong_ho_id')->nullable()->constrained('dong_hos')->cascadeOnDelete();
            $table->string('ho_ten');
            $table->string('email')->unique();
            $table->string('google_id')->nullable()->unique();
            $table->string('avatar')->nullable();
            $table->text('tieu_su')->nullable();
            $table->string('password');
            $table->foreignId('thanh_vien_id')->nullable()->constrained('thanh_viens')->nullOnDelete();
            $table->string('quyen_han')->default('thanh_vien');
            $table->boolean('trang_thai')->default(true)->comment('true: hoạt động, false: bị khóa');
            $table->string('trang_thai_gia_nhap', 50)->default('da_duyet')->comment('cho_duyet, da_duyet, tu_choi');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nguoi_dungs');
    }
};
