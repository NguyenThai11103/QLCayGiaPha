<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            DongHoSeeder::class,
            ThanhVienSeeder::class,
            NguoiDungSeeder::class,
            QuanHeSeeder::class,
            SuKienSeeder::class,
            TaiLieuSeeder::class,
        ]);
    }
}
