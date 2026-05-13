<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dong_ho_tai_khoans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_dong_ho')->constrained('dong_hos')->cascadeOnDelete();
            $table->foreignId('id_tai_khoan')->constrained('tai_khoans')->cascadeOnDelete();
            $table->string('vai_tro')->default('thanh_vien');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dong_ho_tai_khoans');
    }
};
