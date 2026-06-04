<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('nhat_ky_gia_phas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dong_ho_id')->constrained('dong_hos')->onDelete('cascade');
            $table->foreignId('thanh_vien_id')->nullable()->constrained('thanh_viens')->onDelete('set null');
            $table->foreignId('nguoi_thuc_hien_id')->nullable()->constrained('nguoi_dungs')->onDelete('set null');
            $table->string('hanh_dong'); // 'create', 'update', 'delete', 'restore'
            $table->json('du_lieu_cu')->nullable();
            $table->json('du_lieu_moi')->nullable();
            $table->string('mo_ta')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nhat_ky_gia_phas');
    }
};
