<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Admin::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'ho_ten' => 'Admin Hệ Thống',
                'password' => Hash::make('123456'), // Mật khẩu mặc định là 123456
                'quyen_han' => 'admin',
                'trang_thai' => true,
            ]
        );
    }
}
