<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tham_gia_su_kiens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_su_kien')->constrained('su_kiens')->cascadeOnDelete();
            $table->foreignId('id_nguoi')->constrained('nguois')->cascadeOnDelete();
            $table->string('vai_tro')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tham_gia_su_kiens');
    }
};
