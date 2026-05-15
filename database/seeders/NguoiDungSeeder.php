<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class NguoiDungSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('nguoi_dungs')->insert([
            [
                'dong_ho_id' => null,
                'ho_ten' => 'Admin Hệ Thống',
                'email' => 'admin@hethong.com',
                'password' => Hash::make('password'),
                'quyen_han' => 'admin',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 1,
                'ho_ten' => 'Trưởng Tộc Nguyễn Bá',
                'email' => 'truongtoc@gmail.com',
                'password' => Hash::make('password'),
                'quyen_han' => 'quan_ly',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 1,
                'ho_ten' => 'Thành Viên 1',
                'email' => 'user1@gmail.com',
                'password' => Hash::make('password'),
                'quyen_han' => 'thanh_vien',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 1,
                'ho_ten' => 'Thành Viên 2',
                'email' => 'user2@gmail.com',
                'password' => Hash::make('password'),
                'quyen_han' => 'thanh_vien',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 1,
                'ho_ten' => 'Thành Viên 3',
                'email' => 'user3@gmail.com',
                'password' => Hash::make('password'),
                'quyen_han' => 'thanh_vien',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
