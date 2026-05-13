<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('su_kiens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_dong_ho')->constrained('dong_hos')->cascadeOnDelete();
            $table->string('tieu_de');
            $table->text('noi_dung')->nullable();
            $table->date('ngay_dien_ra')->nullable();
            $table->string('dia_diem')->nullable();
            $table->foreignId('id_nguoi_tao')->nullable()->constrained('tai_khoans')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('su_kiens');
    }
};
