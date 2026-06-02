<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('khu_mos', function (Blueprint $table) {
            $table->json('anh_khu_mo_paths')->nullable()->after('anh_khu_mo_disk');
        });

        DB::table('khu_mos')
            ->whereNotNull('anh_khu_mo_path')
            ->whereNull('anh_khu_mo_paths')
            ->orderBy('id')
            ->get(['id', 'anh_khu_mo_path'])
            ->each(function ($row) {
                DB::table('khu_mos')
                    ->where('id', $row->id)
                    ->update(['anh_khu_mo_paths' => json_encode([$row->anh_khu_mo_path])]);
            });
    }

    public function down(): void
    {
        Schema::table('khu_mos', function (Blueprint $table) {
            $table->dropColumn('anh_khu_mo_paths');
        });
    }
};
