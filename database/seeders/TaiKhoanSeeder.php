<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TaiKhoanSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('tai_khoans')->insert([
            [
                'ten' => 'Admin Hệ Thống',
                'email' => 'admin@hethong.com',
                'mat_khau' => Hash::make('password'),
                'vai_tro' => 'admin',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ten' => 'Người Dùng 1',
                'email' => 'user1@gmail.com',
                'mat_khau' => Hash::make('password'),
                'vai_tro' => 'thanh_vien',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }
}
