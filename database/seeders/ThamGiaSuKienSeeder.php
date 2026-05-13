<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ThamGiaSuKienSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('tham_gia_su_kiens')->insert([
            [
                'id_su_kien' => 1,
                'id_nguoi' => 3, // Nguyễn Bá Bình
                'vai_tro' => 'chu_tri',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_su_kien' => 1,
                'id_nguoi' => 4, // Nguyễn Bá Cường
                'vai_tro' => 'tham_gia',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }
}
