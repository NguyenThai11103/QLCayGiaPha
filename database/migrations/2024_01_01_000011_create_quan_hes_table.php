<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quan_hes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_nguoi')->constrained('nguois')->cascadeOnDelete();
            $table->foreignId('id_nguoi_lien_quan')->constrained('nguois')->cascadeOnDelete();
            $table->string('loai');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quan_hes');
    }
};
