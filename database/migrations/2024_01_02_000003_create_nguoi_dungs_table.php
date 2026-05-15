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
            $table->string('password');
            $table->foreignId('thanh_vien_id')->nullable()->constrained('thanh_viens')->nullOnDelete();
            $table->string('quyen_han')->default('thanh_vien');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nguoi_dungs');
    }
};
