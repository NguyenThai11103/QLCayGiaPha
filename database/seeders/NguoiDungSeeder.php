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
           // --- HỆ THỐNG & DÒNG HỌ 1: NGUYỄN BÁ ---
            [
                'dong_ho_id' => 1,
                'ho_ten' => 'Nguyễn Bá Bình (Trưởng Tộc)',
                'email' => 'truongtoc@gmail.com',
                'password' => Hash::make('password'),
                'quyen_han' => 'quan_ly',
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 1,
                'ho_ten' => 'Nguyễn Bá Cường',
                'email' => 'user1@gmail.com',
                'password' => Hash::make('password'),
                'quyen_han' => 'thanh_vien',
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 1,
                'ho_ten' => 'Nguyễn Thị Lan',
                'email' => 'user2@gmail.com',
                'password' => Hash::make('password'),
                'quyen_han' => 'thanh_vien',
                'created_at' => now(), 'updated_at' => now(),
            ],

            // --- DÒNG HỌ 2: TRẦN LÊ ---
            [
                'dong_ho_id' => 2,
                'ho_ten' => 'Trưởng Tộc Trần Lê',
                'email' => 'quanlytranle@gmail.com',
                'password' => Hash::make('password'),
                'quyen_han' => 'quan_ly',
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 2,
                'ho_ten' => 'Trần Lê Gia Bảo',
                'email' => 'giabao@gmail.com',
                'password' => Hash::make('password'),
                'quyen_han' => 'thanh_vien',
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 2,
                'ho_ten' => 'Trần Lê Minh Anh',
                'email' => 'minhanh@gmail.com',
                'password' => Hash::make('password'),
                'quyen_han' => 'thanh_vien',
                'created_at' => now(), 'updated_at' => now(),
            ],

            // --- DÒNG HỌ 3: PHẠM VŨ ---
            [
                'dong_ho_id' => 3,
                'ho_ten' => 'Trưởng Tộc Phạm Vũ',
                'email' => 'quanlyphamvu@gmail.com',
                'password' => Hash::make('password'),
                'quyen_han' => 'quan_ly',
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 3,
                'ho_ten' => 'Phạm Vũ Thảo Chi',
                'email' => 'thaochi@gmail.com',
                'password' => Hash::make('password'),
                'quyen_han' => 'thanh_vien',
                'created_at' => now(), 'updated_at' => now(),
            ],

        ]);
    }
}
