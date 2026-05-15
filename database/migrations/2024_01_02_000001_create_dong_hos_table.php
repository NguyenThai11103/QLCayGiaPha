<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dong_hos', function (Blueprint $table) {
            $table->id();
            $table->string('ten_dong_ho');
            $table->text('mo_ta')->nullable();
            $table->string('dia_chi_tu_duong')->nullable();
            $table->unsignedBigInteger('thuy_to_id')->nullable();
            $table->unsignedBigInteger('nguoi_tao')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dong_hos');
    }
};
