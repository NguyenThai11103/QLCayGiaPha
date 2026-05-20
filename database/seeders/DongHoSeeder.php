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
            ],
            [
                'ten_dong_ho' => 'Nguyễn Văn',
                'mo_ta' => 'Dòng họ Nguyễn Văn tại Huế',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ten_dong_ho' => 'Trương Thị',
                'mo_ta' => 'Dòng họ Trương Thị tại Quảng Bình',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ten_dong_ho' => 'Lê Hữu',
                'mo_ta' => 'Dòng họ Lê Hữu phát tích tại Thanh Hóa',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ten_dong_ho' => 'Phạm Vũ',
                'mo_ta' => 'Dòng họ Phạm Vũ tại Thái Bình',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ten_dong_ho' => 'Hoàng Ngô',
                'mo_ta' => 'Dòng họ Hoàng Ngô tại Nghệ An',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ten_dong_ho' => 'Võ Nguyên',
                'mo_ta' => 'Dòng họ Võ Nguyên tại Quảng Bình',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ten_dong_ho' => 'Phan Đình',
                'mo_ta' => 'Dòng họ Phan Đình tại Hà Tĩnh',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ten_dong_ho' => 'Đặng Trần',
                'mo_ta' => 'Dòng họ Đặng Trần tại Hà Nội',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ten_dong_ho' => 'Bùi Thế',
                'mo_ta' => 'Dòng họ Bùi Thế tại Hải Dương',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ten_dong_ho' => 'Lý Gia',
                'mo_ta' => 'Dòng họ Lý Gia có nguồn gốc từ Ninh Bình',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ten_dong_ho' => 'Huỳnh Ngọc',
                'mo_ta' => 'Dòng họ Huỳnh Ngọc tại Quảng Nam',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ten_dong_ho' => 'Đỗ Vạn',
                'mo_ta' => 'Dòng họ Đỗ Vạn tại Phú Thọ',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
