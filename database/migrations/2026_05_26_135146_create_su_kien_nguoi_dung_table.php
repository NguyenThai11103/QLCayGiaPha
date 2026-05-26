<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('su_kien_nguoi_dung', function (Blueprint $table) {
            $table->id();
            $table->foreignId('su_kien_id')->constrained('su_kiens')->cascadeOnDelete();
            $table->foreignId('nguoi_dung_id')->constrained('nguoi_dungs')->cascadeOnDelete();
            $table->integer('so_nguoi_di_cung')->default(0);
            $table->string('ghi_chu')->nullable();
            $table->timestamps();
            
            $table->unique(['su_kien_id', 'nguoi_dung_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('su_kien_nguoi_dung');
    }
};
