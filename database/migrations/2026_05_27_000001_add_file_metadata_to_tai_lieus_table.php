<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tai_lieus', function (Blueprint $table) {
            $table->string('ten_tai_lieu')->nullable()->after('thanh_vien_id');
            $table->text('mo_ta')->nullable()->after('ten_tai_lieu');
            $table->string('ten_file_goc')->nullable()->after('duong_dan_file');
            $table->string('mime_type', 100)->nullable()->after('loai_file');
            $table->unsignedBigInteger('kich_thuoc')->nullable()->after('mime_type');
            $table->string('disk', 50)->nullable()->after('kich_thuoc');
            $table->string('path')->nullable()->after('disk');
            $table->foreignId('nguoi_tai_len_id')->nullable()->after('path')->constrained('nguoi_dungs')->nullOnDelete();

            $table->index(['dong_ho_id', 'loai_file']);
        });
    }

    public function down(): void
    {
        Schema::table('tai_lieus', function (Blueprint $table) {
            $table->dropForeign(['nguoi_tai_len_id']);
            $table->dropIndex(['dong_ho_id', 'loai_file']);
            $table->dropColumn([
                'ten_tai_lieu',
                'mo_ta',
                'ten_file_goc',
                'mime_type',
                'kich_thuoc',
                'disk',
                'path',
                'nguoi_tai_len_id',
            ]);
        });
    }
};
