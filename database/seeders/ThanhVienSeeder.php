<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ThanhVienSeeder extends Seeder
{
    public function run(): void
    {
        // Tắt khóa ngoại để dọn dẹp dữ liệu cũ an toàn
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('quan_hes')->truncate();
        DB::table('thanh_viens')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // ==========================================
        // THẾ HỆ 1 (F1)
        // ==========================================
        $idOngDao = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id'      => 1,
            'ho_ten'          => 'Nguyễn Bá Đạo',
            'gioi_tinh'       => 'nam',
            'doi_thu'         => 1,
            'ngay_sinh_duong' => '1930-01-01',
            'tinh_trang_song' => 'mat',
            'ngay_mat_am'     => '2020-05-10',
            'tieu_su'         => 'Ông tổ đời thứ 1 của dòng họ Nguyễn Bá',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        $idBaNhan = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id'      => 1,
            'ho_ten'          => 'Trần Thị Nhàn',
            'gioi_tinh'       => 'nu',
            'doi_thu'         => 1,
            'ngay_sinh_duong' => '1935-02-15',
            'tinh_trang_song' => 'song',
            'tieu_su'         => 'Vợ Cả của cụ Nguyễn Bá Đạo',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        $idBaMy = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id'      => 1,
            'ho_ten'          => 'Lê Thị Mỹ',
            'gioi_tinh'       => 'nu',
            'doi_thu'         => 1,
            'ngay_sinh_duong' => '1940-06-20',
            'tinh_trang_song' => 'mat',
            'tieu_su'         => 'Vợ Thứ của cụ Nguyễn Bá Đạo',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        // Mối quan hệ vợ chồng F1
        $this->taoQuanHeVoChong($idOngDao, $idBaNhan);
        $this->taoQuanHeVoChong($idOngDao, $idBaMy);


        // ==========================================
        // THẾ HỆ 2 (F2)
        // ==========================================
        
        // --- Nhánh của Vợ Cả Trần Thị Nhàn ---
        $idBinh = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id'      => 1,
            'ho_ten'          => 'Nguyễn Bá Bình',
            'gioi_tinh'       => 'nam',
            'doi_thu'         => 2,
            'thu_tu_sinh'     => 1,
            'ngay_sinh_duong' => '1955-08-20',
            'tinh_trang_song' => 'song',
            'tieu_su'         => 'Con trai trưởng (nhánh cả)',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);
        $idHong = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id'      => 1,
            'ho_ten'          => 'Phạm Thị Hồng',
            'gioi_tinh'       => 'nu',
            'doi_thu'         => 2,
            'tinh_trang_song' => 'song',
            'tieu_su'         => 'Vợ của Nguyễn Bá Bình',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);
        $this->taoQuanHeVoChong($idBinh, $idHong);
        $this->taoQuanHeChaMeCon($idOngDao, $idBaNhan, $idBinh);

        $idHoa = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id'      => 1,
            'ho_ten'          => 'Nguyễn Thị Hoa',
            'gioi_tinh'       => 'nu',
            'doi_thu'         => 2,
            'thu_tu_sinh'     => 2,
            'ngay_sinh_duong' => '1958-03-12',
            'tinh_trang_song' => 'song',
            'tieu_su'         => 'Con gái thứ hai',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);
        $idHungRe = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id'      => 1,
            'ho_ten'          => 'Vũ Văn Hùng',
            'gioi_tinh'       => 'nam',
            'doi_thu'         => 2,
            'tinh_trang_song' => 'song',
            'tieu_su'         => 'Chồng của Nguyễn Thị Hoa',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);
        $this->taoQuanHeVoChong($idHungRe, $idHoa);
        $this->taoQuanHeChaMeCon($idOngDao, $idBaNhan, $idHoa);

        $idHung = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id'      => 1,
            'ho_ten'          => 'Nguyễn Bá Hùng',
            'gioi_tinh'       => 'nam',
            'doi_thu'         => 2,
            'thu_tu_sinh'     => 3,
            'ngay_sinh_duong' => '1962-11-05',
            'tinh_trang_song' => 'song',
            'tieu_su'         => 'Con trai thứ ba',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);
        $idLan = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id'      => 1,
            'ho_ten'          => 'Hoàng Thị Lan',
            'gioi_tinh'       => 'nu',
            'doi_thu'         => 2,
            'tinh_trang_song' => 'song',
            'tieu_su'         => 'Vợ của Nguyễn Bá Hùng',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);
        $this->taoQuanHeVoChong($idHung, $idLan);
        $this->taoQuanHeChaMeCon($idOngDao, $idBaNhan, $idHung);

        // --- Nhánh của Vợ Thứ Lê Thị Mỹ ---
        $idSon = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id'      => 1,
            'ho_ten'          => 'Nguyễn Bá Sơn',
            'gioi_tinh'       => 'nam',
            'doi_thu'         => 2,
            'thu_tu_sinh'     => 4,
            'ngay_sinh_duong' => '1968-07-25',
            'tinh_trang_song' => 'song',
            'tieu_su'         => 'Con trai út (nhánh thứ)',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);
        $idMai = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id'      => 1,
            'ho_ten'          => 'Ngô Thị Mai',
            'gioi_tinh'       => 'nu',
            'doi_thu'         => 2,
            'tinh_trang_song' => 'song',
            'tieu_su'         => 'Vợ của Nguyễn Bá Sơn',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);
        $this->taoQuanHeVoChong($idSon, $idMai);
        $this->taoQuanHeChaMeCon($idOngDao, $idBaMy, $idSon);


        // ==========================================
        // THẾ HỆ 3 (F3)
        // ==========================================

        // --- Nhánh từ Nguyễn Bá Bình + Phạm Thị Hồng ---
        $idCuong = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id'      => 1,
            'ho_ten'          => 'Nguyễn Bá Cường',
            'gioi_tinh'       => 'nam',
            'doi_thu'         => 3,
            'thu_tu_sinh'     => 1,
            'ngay_sinh_duong' => '1980-10-25',
            'tinh_trang_song' => 'song',
            'tieu_su'         => 'Cháu đích tôn dòng họ',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);
        $idThuy = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id'      => 1,
            'ho_ten'          => 'Đỗ Thị Thủy',
            'gioi_tinh'       => 'nu',
            'doi_thu'         => 3,
            'tinh_trang_song' => 'song',
            'tieu_su'         => 'Vợ của Nguyễn Bá Cường',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);
        $this->taoQuanHeVoChong($idCuong, $idThuy);
        $this->taoQuanHeChaMeCon($idBinh, $idHong, $idCuong);

        $idLinh = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id'      => 1,
            'ho_ten'          => 'Nguyễn Thị Linh',
            'gioi_tinh'       => 'nu',
            'doi_thu'         => 3,
            'thu_tu_sinh'     => 2,
            'ngay_sinh_duong' => '1984-04-18',
            'tinh_trang_song' => 'song',
            'tieu_su'         => 'Cháu gái thế hệ F3',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);
        $idTuanRe = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id'      => 1,
            'ho_ten'          => 'Trần Văn Tuấn',
            'gioi_tinh'       => 'nam',
            'doi_thu'         => 3,
            'tinh_trang_song' => 'song',
            'tieu_su'         => 'Chồng của Nguyễn Thị Linh',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);
        $this->taoQuanHeVoChong($idTuanRe, $idLinh);
        $this->taoQuanHeChaMeCon($idBinh, $idHong, $idLinh);

        // --- Nhánh từ Nguyễn Bá Hùng + Hoàng Thị Lan ---
        $idDung = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id'      => 1,
            'ho_ten'          => 'Nguyễn Bá Dũng',
            'gioi_tinh'       => 'nam',
            'doi_thu'         => 3,
            'thu_tu_sinh'     => 1,
            'ngay_sinh_duong' => '1988-09-02',
            'tinh_trang_song' => 'song',
            'tieu_su'         => 'Cháu trai thế hệ F3',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);
        $idCuc = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id'      => 1,
            'ho_ten'          => 'Bùi Thị Cúc',
            'gioi_tinh'       => 'nu',
            'doi_thu'         => 3,
            'tinh_trang_song' => 'song',
            'tieu_su'         => 'Vợ của Nguyễn Bá Dũng',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);
        $this->taoQuanHeVoChong($idDung, $idCuc);
        $this->taoQuanHeChaMeCon($idHung, $idLan, $idDung);

        // --- Nhánh từ Nguyễn Bá Sơn + Ngô Thị Mai ---
        $idTuyet = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id'      => 1,
            'ho_ten'          => 'Nguyễn Thị Tuyết',
            'gioi_tinh'       => 'nu',
            'doi_thu'         => 3,
            'thu_tu_sinh'     => 1,
            'ngay_sinh_duong' => '1995-12-12',
            'tinh_trang_song' => 'song',
            'tieu_su'         => 'Cháu gái thế hệ F3',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);
        $idDucRe = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id'      => 1,
            'ho_ten'          => 'Phan Văn Đức',
            'gioi_tinh'       => 'nam',
            'doi_thu'         => 3,
            'tinh_trang_song' => 'song',
            'tieu_su'         => 'Chồng của Nguyễn Thị Tuyết',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);
        $this->taoQuanHeVoChong($idDucRe, $idTuyet);
        $this->taoQuanHeChaMeCon($idSon, $idMai, $idTuyet);


        // ==========================================
        // THẾ HỆ 4 (F4)
        // ==========================================

        // --- Con của Nguyễn Bá Cường + Đỗ Thị Thủy ---
        $idPhuc = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id'      => 1,
            'ho_ten'          => 'Nguyễn Bá Phúc',
            'gioi_tinh'       => 'nam',
            'doi_thu'         => 4,
            'thu_tu_sinh'     => 1,
            'ngay_sinh_duong' => '2005-03-20',
            'tinh_trang_song' => 'song',
            'tieu_su'         => 'Chắt đích tôn F4',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);
        $this->taoQuanHeChaMeCon($idCuong, $idThuy, $idPhuc);

        $idKhanh = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id'      => 1,
            'ho_ten'          => 'Nguyễn Thị Khánh',
            'gioi_tinh'       => 'nu',
            'doi_thu'         => 4,
            'thu_tu_sinh'     => 2,
            'ngay_sinh_duong' => '2008-07-15',
            'tinh_trang_song' => 'song',
            'tieu_su'         => 'Chắt gái F4',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);
        $this->taoQuanHeChaMeCon($idCuong, $idThuy, $idKhanh);

        // --- Con của Nguyễn Bá Dũng + Bùi Thị Cúc ---
        $idKhang = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id'      => 1,
            'ho_ten'          => 'Nguyễn Bá Khang',
            'gioi_tinh'       => 'nam',
            'doi_thu'         => 4,
            'thu_tu_sinh'     => 1,
            'ngay_sinh_duong' => '2015-11-20',
            'tinh_trang_song' => 'song',
            'tieu_su'         => 'Chắt trai F4',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);
        $this->taoQuanHeChaMeCon($idDung, $idCuc, $idKhang);
    }

    private function taoQuanHeVoChong(int $chongId, int $voId): void
    {
        DB::table('quan_hes')->insert([
            'node_1_id'           => $chongId,
            'node_2_id'           => $voId,
            'loai_quan_he'        => 'vo_chong',
            'tinh_trang_hon_nhan' => 'dang_ket_hon',
            'created_at'          => now(),
            'updated_at'          => now(),
        ]);
    }

    private function taoQuanHeChaMeCon(int $chaId, int $meId, int $conId): void
    {
        DB::table('quan_hes')->insert([
            [
                'node_1_id'         => $chaId,
                'node_2_id'         => $conId,
                'loai_quan_he'      => 'cha_con',
                'tinh_chat_quan_he' => 'ruot_thit',
                'created_at'        => now(),
                'updated_at'        => now(),
            ],
            [
                'node_1_id'         => $meId,
                'node_2_id'         => $conId,
                'loai_quan_he'      => 'me_con',
                'tinh_chat_quan_he' => 'ruot_thit',
                'created_at'        => now(),
                'updated_at'        => now(),
            ]
        ]);
    }
}
