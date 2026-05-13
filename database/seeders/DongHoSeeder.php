<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DongHoSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('dong_hos')->insert([
            [
                'ten_dong_ho' => 'Nguyễn Bá',
                'mo_ta' => 'Dòng họ Nguyễn Bá tại Bắc Ninh',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ten_dong_ho' => 'Trần Văn',
                'mo_ta' => 'Dòng họ Trần Văn tại Nam Định',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }
}
