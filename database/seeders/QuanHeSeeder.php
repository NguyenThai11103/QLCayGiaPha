<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class QuanHeSeeder extends Seeder
{
    public function run(): void
    {
        $idDao = DB::table('thanh_viens')->where('ho_ten', 'Nguyen Ba Dao')->value('id');
        $idNhan = DB::table('thanh_viens')->where('ho_ten', 'Tran Thi Nhan')->value('id');
        $idMinh = DB::table('thanh_viens')->where('ho_ten', 'Nguyen Ba Minh')->value('id');
        $idCuong = DB::table('thanh_viens')->where('ho_ten', 'Nguyen Ba Cuong')->value('id');
        $idHoa = DB::table('thanh_viens')->where('ho_ten', 'Nguyen Thi Hoa')->value('id');

        DB::table('quan_hes')->insert([
            [
                'node_1_id' => $idDao,
                'node_2_id' => $idNhan,
                'loai_quan_he' => 'vo_chong',
                'tinh_chat_quan_he' => null,
                'tinh_trang_hon_nhan' => 'dang_ket_hon',
            ],
            [
                'node_1_id' => $idDao,
                'node_2_id' => $idMinh,
                'loai_quan_he' => 'cha_con',
                'tinh_chat_quan_he' => 'ruot_thit',
                'tinh_trang_hon_nhan' => null,
            ],
            [
                'node_1_id' => $idMinh,
                'node_2_id' => $idCuong,
                'loai_quan_he' => 'cha_con',
                'tinh_chat_quan_he' => 'ruot_thit',
                'tinh_trang_hon_nhan' => null,
            ],
            [
                'node_1_id' => $idMinh,
                'node_2_id' => $idHoa,
                'loai_quan_he' => 'cha_con',
                'tinh_chat_quan_he' => 'ruot_thit',
                'tinh_trang_hon_nhan' => null,
            ],
        ]);
    }
}
