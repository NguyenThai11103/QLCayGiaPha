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
            $table->foreignId('dong_ho_id')->constrained('dong_hos')->cascadeOnDelete();
            $table->foreignId('thanh_vien_id')->nullable()->constrained('thanh_viens')->nullOnDelete();
            $table->string('ten_su_kien');
            $table->string('loai_su_kien')->nullable();
            $table->date('ngay_duong')->nullable();
            $table->date('ngay_am')->nullable();
            $table->boolean('lap_lai_hang_nam')->default(false);
            $table->string('dia_diem')->nullable();
            $table->text('mo_ta')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('su_kiens');
    }
};
