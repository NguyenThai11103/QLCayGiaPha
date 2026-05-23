<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class NguoiDungSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('nguoi_dungs')->insert([
           // --- HỆ THỐNG & DÒNG HỌ 1: NGUYỄN BÁ ---
            [
                'dong_ho_id' => 1,
                'ho_ten' => 'Nguyễn Bá Bình (Trưởng Tộc)',
                'email' => Str::slug(str_replace('(Trưởng Tộc)', '', 'Nguyễn Bá Bình'), '') . '@gmail.com',
                'password' => Hash::make('111111'),
                'quyen_han' => 'quan_ly',
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 1,
                'ho_ten' => 'Nguyễn Bá Cường',
                'email' => Str::slug('Nguyễn Bá Cường', '') . '@gmail.com',
                'password' => Hash::make('111111'),
                'quyen_han' => 'thanh_vien',
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 1,
                'ho_ten' => 'Nguyễn Thị Lan',
                'email' => Str::slug('Nguyễn Thị Lan', '') . '@gmail.com',
                'password' => Hash::make('111111'),
                'quyen_han' => 'thanh_vien',
                'created_at' => now(), 'updated_at' => now(),
            ],

            // --- DÒNG HỌ 2: TRẦN LÊ ---
            [
                'dong_ho_id' => 2,
                'ho_ten' => 'Trần Lê Kỷ (Trưởng Tộc)',
                'email' => Str::slug(str_replace('(Trưởng Tộc)', '', 'Trần Lê Kỷ'), '') . '@gmail.com',
                'password' => Hash::make('111111'),
                'quyen_han' => 'quan_ly',
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 2,
                'ho_ten' => 'Trần Lê Gia Bảo',
                'email' => Str::slug('Trần Lê Gia Bảo', '') . '@gmail.com',
                'password' => Hash::make('111111'),
                'quyen_han' => 'thanh_vien',
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'dong_ho_id' => 2,
                'ho_ten' => 'Trần Lê Minh Anh',
                'email' => Str::slug('Trần Lê Minh Anh', '') . '@gmail.com',
                'password' => Hash::make('111111'),
                'quyen_han' => 'thanh_vien',
                'created_at' => now(), 'updated_at' => now(),
            ],
        ]);
    }
}
