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
            TaiKhoanSeeder::class,
            DongHoTaiKhoanSeeder::class,
            NguoiSeeder::class,
            QuanHeSeeder::class,
            SuKienSeeder::class,
            ThamGiaSuKienSeeder::class,
            TepTinSeeder::class,
        ]);
    }
}
