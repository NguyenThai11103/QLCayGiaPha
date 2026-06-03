<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loi_moi_tham_gias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dong_ho_id')->constrained('dong_hos')->cascadeOnDelete();
            $table->foreignId('thanh_vien_id')->constrained('thanh_viens')->cascadeOnDelete();
            $table->foreignId('invited_by')->nullable()->constrained('nguoi_dungs')->nullOnDelete();
            $table->string('email')->nullable();
            $table->string('token_hash', 64)->unique();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->foreignId('accepted_by')->nullable()->constrained('nguoi_dungs')->nullOnDelete();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamp('last_sent_at')->nullable();
            $table->timestamps();

            $table->index(['dong_ho_id', 'thanh_vien_id']);
            $table->index(['email', 'accepted_at', 'revoked_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loi_moi_tham_gias');
    }
};
