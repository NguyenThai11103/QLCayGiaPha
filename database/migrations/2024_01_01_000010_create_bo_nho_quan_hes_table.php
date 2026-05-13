<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bo_nho_quan_hes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_tu_nguoi')->constrained('nguois')->cascadeOnDelete();
            $table->foreignId('id_den_nguoi')->constrained('nguois')->cascadeOnDelete();
            $table->string('ten_quan_he');
            $table->json('duong_di')->nullable();
            
            $table->unique(['id_tu_nguoi', 'id_den_nguoi']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bo_nho_quan_hes');
    }
};
