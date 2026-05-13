<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tep_tins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_nguoi')->nullable()->constrained('nguois')->cascadeOnDelete();
            $table->foreignId('id_dong_ho')->nullable()->constrained('dong_hos')->cascadeOnDelete();
            $table->string('duong_dan');
            $table->string('loai');
            $table->text('mo_ta')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tep_tins');
    }
};
