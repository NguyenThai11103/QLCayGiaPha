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
            $table->string('duong_dan_file');
            $table->string('loai_file', 50);
            $table->text('du_lieu_orc')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tai_lieus');
    }
};
