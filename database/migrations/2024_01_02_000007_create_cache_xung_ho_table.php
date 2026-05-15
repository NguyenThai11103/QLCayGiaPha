<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cache_xung_ho', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dong_ho_id')->constrained('dong_hos')->cascadeOnDelete();
            $table->foreignId('nguoi_goi_id')->constrained('thanh_viens')->cascadeOnDelete();
            $table->foreignId('nguoi_nghe_id')->constrained('thanh_viens')->cascadeOnDelete();
            $table->string('danh_xung_a')->nullable();
            $table->string('danh_xung_b')->nullable();
            $table->integer('khoang_cach_doi')->nullable();
            $table->string('pattern_duong_di')->nullable();
            $table->unique(['dong_ho_id', 'nguoi_goi_id', 'nguoi_nghe_id']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cache_xung_ho');
    }
};
