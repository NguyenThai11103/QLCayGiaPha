<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('admins')->insert([
            [
                'ho_ten' => 'Admin He Thong',
                'email' => 'admin@hethong.com',
                'password' => Hash::make('password'),
                'quyen_han' => 'admin',
                'trang_thai' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ho_ten' => 'Nguyen Minh Quan',
                'email' => 'quan.admin@example.com',
                'password' => Hash::make('password'),
                'quyen_han' => 'admin',
                'trang_thai' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ho_ten' => 'Tran Thi Mai',
                'email' => 'mai.admin@example.com',
                'password' => Hash::make('password'),
                'quyen_han' => 'admin',
                'trang_thai' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ho_ten' => 'Le Hoang Nam',
                'email' => 'nam.admin@example.com',
                'password' => Hash::make('password'),
                'quyen_han' => 'admin',
                'trang_thai' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ho_ten' => 'Pham Ngoc Anh',
                'email' => 'anh.admin@example.com',
                'password' => Hash::make('password'),
                'quyen_han' => 'admin',
                'trang_thai' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
