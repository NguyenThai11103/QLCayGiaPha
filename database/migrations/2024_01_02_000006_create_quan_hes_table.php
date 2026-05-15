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
            $table->foreignId('node_1_id')->constrained('thanh_viens')->cascadeOnDelete();
            $table->foreignId('node_2_id')->constrained('thanh_viens')->cascadeOnDelete();
            $table->string('loai_quan_he', 50);
            $table->string('tinh_chat_quan_he', 50)->nullable();
            $table->string('tinh_trang_hon_nhan', 50)->nullable();
            $table->unique(['node_1_id', 'node_2_id', 'loai_quan_he']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quan_hes');
    }
};
