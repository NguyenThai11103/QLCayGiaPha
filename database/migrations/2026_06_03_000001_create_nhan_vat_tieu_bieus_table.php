<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nhan_vat_tieu_bieus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dong_ho_id')->constrained('dong_hos')->cascadeOnDelete();
            $table->foreignId('thanh_vien_id')->constrained('thanh_viens')->cascadeOnDelete();
            $table->string('tieu_de')->nullable();
            $table->text('tom_tat')->nullable();
            $table->longText('cau_chuyen')->nullable();
            $table->longText('dong_gop')->nullable();
            $table->string('linh_vuc')->nullable();
            $table->string('giai_doan')->nullable();
            $table->integer('nam_bat_dau')->nullable();
            $table->integer('nam_ket_thuc')->nullable();
            $table->string('anh_bia_path')->nullable();
            $table->string('anh_bia_disk', 50)->nullable();
            $table->boolean('noi_bat')->default(false);
            $table->string('trang_thai', 20)->default('published');
            $table->integer('thu_tu_hien_thi')->default(0);
            $table->foreignId('nguoi_cap_nhat_id')->nullable()->constrained('nguoi_dungs')->nullOnDelete();
            $table->timestamps();

            $table->unique(['dong_ho_id', 'thanh_vien_id']);
            $table->index(['dong_ho_id', 'trang_thai', 'noi_bat']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nhan_vat_tieu_bieus');
    }
};
