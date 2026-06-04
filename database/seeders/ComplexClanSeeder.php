<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Faker\Factory as Faker;
use LucNham\LunarCalendar\LunarDateTime;
use Throwable;

class ComplexClanSeeder extends Seeder
{
    private $faker;
    private $dongHoId;
    private $ho = 'Võ Quốc';
    private $maxDoi = 6;
    private $diaChi = [
        'Phường Thạch Thang, Quận Hải Châu, TP Đà Nẵng',
        'Phường Hòa Cường Bắc, Quận Hải Châu, TP Đà Nẵng',
        'Phường Hòa Khánh Bắc, Quận Liên Chiểu, TP Đà Nẵng',
        'Phường An Hải Bắc, Quận Sơn Trà, TP Đà Nẵng',
        'Phường Khuê Mỹ, Quận Ngũ Hành Sơn, TP Đà Nẵng',
        'Xã Hòa Tiến, Huyện Hòa Vang, TP Đà Nẵng',
    ];

    private function generateName($gioiTinh, $ho = null)
    {
        $hoList = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
        $demNam = ['Văn', 'Đình', 'Hữu', 'Công', 'Đức', 'Minh', 'Quang', 'Quốc', 'Thái', 'Trọng', 'Bá', 'Khắc'];
        $tenNam = ['Hùng', 'Dũng', 'Tuấn', 'Anh', 'Minh', 'Hải', 'Sơn', 'Thắng', 'Đạt', 'Tùng', 'Long', 'Cường', 'Khoa', 'Bình', 'Hoàng', 'Kiên', 'Phong', 'Trung', 'Nam'];
        $demNu = ['Thị', 'Ngọc', 'Thu', 'Phương', 'Thanh', 'Hồng', 'Mai', 'Kim', 'Diễm', 'Bích', 'Kiều'];
        $tenNu = ['Lan', 'Hoa', 'Mai', 'Hương', 'Linh', 'Trang', 'Nga', 'Phương', 'Hằng', 'Quỳnh', 'Thảo', 'Yến', 'Nhung', 'Vy', 'My', 'Quyên', 'Ngân', 'Nhi'];

        $h = $ho ?? $hoList[array_rand($hoList)];
        if ($gioiTinh === 'nam') {
            $dem = $demNam[array_rand($demNam)];
            $ten = $tenNam[array_rand($tenNam)];
        } else {
            $dem = $demNu[array_rand($demNu)];
            $ten = $tenNu[array_rand($tenNu)];
        }

        // Nếu họ đưa vào có 2 chữ (VD: Võ Quốc), bỏ bớt chữ lót mặc định cho đỡ dài nếu thích, nhưng cứ ghép chuẩn
        return $h . ' ' . $dem . ' ' . $ten;
    }

    private function generateTenChinhHuyet($gioiTinh)
    {
        // Con cháu mang họ Võ Quốc thì chỉ cộng thêm 1 chữ tên thôi
        $tenNam = ['Hùng', 'Dũng', 'Tuấn', 'Anh', 'Minh', 'Hải', 'Sơn', 'Thắng', 'Đạt', 'Tùng', 'Long', 'Cường', 'Khoa', 'Bình', 'Hoàng', 'Kiên', 'Phong', 'Trung', 'Nam'];
        $tenNu = ['Lan', 'Hoa', 'Mai', 'Hương', 'Linh', 'Trang', 'Nga', 'Phương', 'Hằng', 'Quỳnh', 'Thảo', 'Yến', 'Nhung', 'Vy', 'My', 'Quyên', 'Ngân', 'Nhi'];

        if ($gioiTinh === 'nam') {
            return $this->ho . ' ' . $tenNam[array_rand($tenNam)];
        }
        return $this->ho . ' ' . $tenNu[array_rand($tenNu)];
    }

    public function run(): void
    {
        $this->faker = Faker::create('vi_VN');

        // Tạo 1 dòng họ duy nhất
        $this->dongHoId = DB::table('dong_hos')->insertGetId([
            'ten_dong_ho' => 'Dòng họ ' . $this->ho,
            'mo_ta' => 'Dòng họ ' . $this->ho . ' lớn nhất tại Đà Nẵng với lịch sử 6 đời liên tiếp.',
            'gia_huan' => 'Con cháu họ Võ Quốc giữ đạo hiếu, kính trên nhường dưới, học hành chăm chỉ và cùng nhau gìn giữ từ đường.',
            'loi_gioi_thieu' => 'Không gian số hóa gia phả, sự kiện, mộ phần và tài liệu của dòng họ Võ Quốc tại Đà Nẵng.',
            'dia_chi_tu_duong' => 'TP Đà Nẵng',
            'anh_tu_duong_path' => 'tu-duong/vo-quoc/tu-duong.svg',
            'theme_color' => 'bronze',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->createTuDuongPhoto();

        // Trưởng tộc (Quản lý)
        $hoTenTruongToc = 'Võ Quốc Trưởng';
        $hoTenS = 'Võ Quốc Sơn';
        $hoTenV = 'Trần Kim Vy';
        
        DB::table('nguoi_dungs')->insert([
            [
                'dong_ho_id' => $this->dongHoId,
                'ho_ten' => $hoTenTruongToc,
                'email' => Str::slug($hoTenTruongToc, '') . '@gmail.com',
                'password' => Hash::make('111111'),
                'quyen_han' => 'truong_toc',
                'tieu_su' => 'Trưởng tộc dòng họ Võ Quốc, phụ trách thông tin chung và phân quyền quản lý cho các thành viên.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'dong_ho_id' => $this->dongHoId,
                'ho_ten' => $hoTenS,
                'email' => Str::slug($hoTenS, '') . '1980@gmail.com',
                'password' => Hash::make('111111'),
                'quyen_han' => 'quan_ly',
                'tieu_su' => 'Quản lý phụ trách cập nhật cây gia phả, mộ phần và sự kiện của nhánh trưởng.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'dong_ho_id' => $this->dongHoId,
                'ho_ten' => $hoTenV,
                'email' => Str::slug($hoTenV, '') . '@gmail.com',
                'password' => Hash::make('111111'),
                'quyen_han' => 'thanh_vien',
                'tieu_su' => 'Thành viên dòng họ, tài khoản mẫu để kiểm thử luồng đăng nhập và cập nhật hồ sơ.',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);

        // Cụ thủy tổ (Đời 1)
        $namSinhCuto = rand(1850, 1860);
        $cuTo = $this->createThanhVien($hoTenTruongToc, 'nam', 1, 1, $namSinhCuto);
        $voCuTo = $this->createThanhVien($this->generateName('nu'), 'nu', 1, 1, $namSinhCuto + rand(-3, 5));
        DB::table('nguoi_dungs')
            ->where('dong_ho_id', $this->dongHoId)
            ->where('ho_ten', $hoTenTruongToc)
            ->update(['thanh_vien_id' => $cuTo['id'], 'updated_at' => now()]);
        
        $this->linkVoChong($cuTo['id'], $voCuTo['id']);

        // Bắt đầu đẻ nhánh (Sinh con ngẫu nhiên)
        $this->generateBranch($cuTo, $voCuTo, 2);

        // KỊCH BẢN ĐẶC BIỆT: Trưởng nam đời 2 có 3 vợ (Để biểu diễn tính năng xếp chồng và chia nhánh theo mẹ)
        $namSinhTruongNam = $namSinhCuto + 25;
        $truongNam = $this->createThanhVien('Võ Quốc Sơn', 'nam', 2, 1, $namSinhTruongNam);
        DB::table('nguoi_dungs')
            ->where('dong_ho_id', $this->dongHoId)
            ->where('ho_ten', $hoTenS)
            ->update(['thanh_vien_id' => $truongNam['id'], 'updated_at' => now()]);
        $this->linkChaCon($cuTo['id'], $truongNam['id']);
        $this->linkMeCon($voCuTo['id'], $truongNam['id']);

        // Vợ 1: Trần Kim Vy (2 con)
        $vo1 = $this->createThanhVien('Trần Kim Vy', 'nu', 2, 1, $namSinhTruongNam - 2);
        DB::table('nguoi_dungs')
            ->where('dong_ho_id', $this->dongHoId)
            ->where('ho_ten', $hoTenV)
            ->update(['thanh_vien_id' => $vo1['id'], 'updated_at' => now()]);
        $this->linkVoChong($truongNam['id'], $vo1['id']);
        for ($i = 1; $i <= 2; $i++) {
            $conV1 = $this->createThanhVien($this->generateTenChinhHuyet('nam'), 'nam', 3, $i, $namSinhTruongNam + 20 + $i*2);
            $this->linkChaCon($truongNam['id'], $conV1['id']);
            $this->linkMeCon($vo1['id'], $conV1['id']);
            $this->generateBranch($truongNam, $vo1, 4); // Sinh cháu
        }

        // Vợ 2: Nguyễn Văn Q (3 con)
        $vo2 = $this->createThanhVien('Nguyễn Văn Q', 'nu', 2, 1, $namSinhTruongNam + 3);
        $this->linkVoChong($truongNam['id'], $vo2['id']);
        for ($i = 3; $i <= 5; $i++) {
            $conV2 = $this->createThanhVien($this->generateTenChinhHuyet('nu'), 'nu', 3, $i, $namSinhTruongNam + 25 + $i*2);
            $this->linkChaCon($truongNam['id'], $conV2['id']);
            $this->linkMeCon($vo2['id'], $conV2['id']);
            $this->generateBranch($truongNam, $vo2, 4); // Sinh cháu
        }

        // Vợ 3: Lê Thị Hoa (1 con)
        $vo3 = $this->createThanhVien('Lê Thị Hoa', 'nu', 2, 1, $namSinhTruongNam + 10);
        $this->linkVoChong($truongNam['id'], $vo3['id']);
        $conV3 = $this->createThanhVien($this->generateTenChinhHuyet('nam'), 'nam', 3, 6, $namSinhTruongNam + 35);
        $this->linkChaCon($truongNam['id'], $conV3['id']);
        $this->linkMeCon($vo3['id'], $conV3['id']);

        // Tạo sự kiện & tài liệu
        $this->createSuKienTaiLieu();
    }

    private function generateBranch($cha, $me, $doiThu)
    {
        if ($doiThu > $this->maxDoi) {
            return;
        }

        // Đời hiện tại sinh năm bao nhiêu? (Cộng thêm 20-35 năm so với cha)
        $namSinhCha = Carbon::parse($cha['ngay_sinh_duong'])->year;
        
        // Càng về sau số con càng ít (Đời cũ 3-6 con, đời mới 1-3 con)
        if ($doiThu <= 3) {
            $soCon = rand(3, 6);
        } elseif ($doiThu <= 4) {
            $soCon = rand(2, 4);
        } else {
            $soCon = rand(1, 3);
        }

        for ($i = 1; $i <= $soCon; $i++) {
            $gioiTinh = rand(0, 1) ? 'nam' : 'nu';
            $namSinhCon = $namSinhCha + rand(20, 40) + ($i * 2); // Khoảng cách sinh các con
            
            // Tên con: mang họ Võ Quốc
            $tenCon = $this->generateTenChinhHuyet($gioiTinh);

            $con = $this->createThanhVien($tenCon, $gioiTinh, $doiThu, $i, $namSinhCon);

            $this->linkChaCon($cha['id'], $con['id']);
            $this->linkMeCon($me['id'], $con['id']);

            // Trưởng thành -> Có vợ chồng -> Sinh con tiếp
            // Phụ nữ ngày xưa (hoặc nam) cưới tầm 18-30 tuổi
            if ($namSinhCon < 2005) {
                // Tỷ lệ có gia đình 90%
                if (rand(1, 100) <= 90) {
                    $gioiTinhVoChong = $gioiTinh === 'nam' ? 'nu' : 'nam';
                    $tenVoChong = $this->generateName($gioiTinhVoChong);
                    $namSinhVoChong = $namSinhCon + rand(-5, 5);
                    
                    $voChong = $this->createThanhVien($tenVoChong, $gioiTinhVoChong, $doiThu, 1, $namSinhVoChong);
                    
                    // Người nam làm gốc liên kết vợ
                    if ($gioiTinh === 'nam') {
                        $this->linkVoChong($con['id'], $voChong['id']);
                        // Nếu là nam (cùng họ) thì cho sinh cháu nội để nối dõi cây phả hệ
                        $this->generateBranch($con, $voChong, $doiThu + 1);
                    } else {
                        $this->linkVoChong($voChong['id'], $con['id']);
                        // Nếu là nữ thì con cái thuộc dòng họ khác (tuỳ logic, ta có thể dừng hoặc đẻ tiếp)
                        // Ở đây ta đẻ ít lại hoặc dừng để tránh bùng nổ dữ liệu (chỉ theo nhánh nam)
                        if (rand(1, 10) <= 3) { // 30% con gái có mang theo cháu ngoại vào phả hệ
                            $this->generateBranch($voChong, $con, $doiThu + 1);
                        }
                    }
                }
            }
        }
    }

    private function createThanhVien($hoTen, $gioiTinh, $doiThu, $thuTu, $namSinh)
    {
        $thang = rand(1, 12);
        $ngay = rand(1, 28);
        $ngaySinhDuong = Carbon::create($namSinh, $thang, $ngay);
        
        $hienTai = date('Y');
        $tuoi = $hienTai - $namSinh;
        
        $tinhTrangSong = 1;
        $ngayMatAm = null;
        $ngayMatDuong = null;

        // Logic sinh tử chân thực
        if ($namSinh < 1950) {
            $tinhTrangSong = 0; // Đã mất
        } elseif ($namSinh < 1970 && rand(1, 100) <= 20) {
            $tinhTrangSong = 0; // 20% khả năng đã mất
        }

        if ($tinhTrangSong == 0) {
            $tuoiTho = rand(50, 95);
            $namMat = $namSinh + $tuoiTho;
            if ($namMat > $hienTai) {
                $namMat = $hienTai - rand(1, 10);
            }
            $ngayMatDuong = Carbon::create($namMat, rand(1, 12), rand(1, 28));
            
            // Đổi sang ngày âm (nếu có thư viện)
            try {
                $lunar = new LunarDateTime($ngayMatDuong->format('Y-m-d H:i:s'), 'UTC');
                $ngayMatAm = $lunar->format('Y-m-d');
            } catch (Throwable $e) {
                $ngayMatAm = $ngayMatDuong->subDays(rand(20, 40))->format('Y-m-d');
            }
            $ngayMatDuong = $ngayMatDuong->format('Y-m-d');
        }

        // 10% có số điện thoại nếu sống và trưởng thành
        $sdt = null;
        if ($tinhTrangSong && $tuoi >= 15 && rand(1, 10) <= 5) {
            $sdt = $this->faker->phoneNumber;
        }

        $id = DB::table('thanh_viens')->insertGetId([
            'dong_ho_id' => $this->dongHoId,
            'ho_ten' => $hoTen,
            'gioi_tinh' => $gioiTinh,
            'doi_thu' => $doiThu,
            'thu_tu_sinh' => $thuTu,
            'ngay_sinh_duong' => $ngaySinhDuong->format('Y-m-d'),
            'tinh_trang_song' => $tinhTrangSong,
            'ngay_mat_am' => $ngayMatAm,
            'nghe_nghiep' => $tuoi > 22 && $tuoi < 65 ? $this->faker->jobTitle : null,
            'dia_chi' => $this->faker->randomElement($this->diaChi),
            'tieu_su' => "Thành viên đời {$doiThu} của dòng họ {$this->ho}, dữ liệu mẫu phục vụ tra cứu gia phả.",
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [
            'id' => $id,
            'ngay_sinh_duong' => $ngaySinhDuong->format('Y-m-d'),
        ];
    }

    private function linkVoChong($namId, $nuId)
    {
        DB::table('quan_hes')->insert([
            'node_1_id' => $namId,
            'node_2_id' => $nuId,
            'loai_quan_he' => 'vo_chong',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function linkChaCon($chaId, $conId)
    {
        DB::table('quan_hes')->insert([
            'node_1_id' => $chaId,
            'node_2_id' => $conId,
            'loai_quan_he' => 'cha_con',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function linkMeCon($meId, $conId)
    {
        DB::table('quan_hes')->insert([
            'node_1_id' => $meId,
            'node_2_id' => $conId,
            'loai_quan_he' => 'me_con',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function createSuKienTaiLieu()
    {
        $now = Carbon::now();
        // SỰ KIỆN
        DB::table('su_kiens')->insert([
            [
                'dong_ho_id' => $this->dongHoId,
                'ten_su_kien' => 'Giỗ Tổ Dòng Họ ' . $this->ho,
                'mo_ta' => 'Lễ tế tổ tiên tại Từ đường chính của dòng họ ở Đà Nẵng, con cháu tề tựu đông đủ.',
                'ngay_duong' => $now->copy()->addDays(15)->format('Y-m-d'),
                'ngay_am' => $now->copy()->addDays(15)->subMonths(1)->format('Y-m-d'),
                'dia_diem' => 'Từ đường dòng họ ' . $this->ho . ' - Hải Châu, Đà Nẵng',
                'loai_su_kien' => 'le_gio',
                'lap_lai_hang_nam' => true,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'dong_ho_id' => $this->dongHoId,
                'ten_su_kien' => 'Lễ Thanh Minh Cảo Mộ',
                'mo_ta' => 'Viếng thăm và dọn dẹp khu lăng mộ tổ tiên.',
                'ngay_duong' => $now->copy()->addDays(40)->format('Y-m-d'),
                'ngay_am' => null,
                'dia_diem' => 'Khu lăng mộ dòng họ - Núi Thiên Ấn',
                'loai_su_kien' => 'khac',
                'lap_lai_hang_nam' => true,
                'created_at' => now(), 'updated_at' => now(),
            ]
        ]);

        // TÀI LIỆU
        DB::table('tai_lieus')->insert([
            [
                'thanh_vien_id' => null,
                'dong_ho_id' => $this->dongHoId,
                'duong_dan_file' => 'uploads/documents/gia_pha_vo_quoc.pdf',
                'loai_file' => 'pdf',
                'du_lieu_orc' => 'Bản phục dựng cuốn gia phả cổ họ ' . $this->ho . ' ghi chép từ năm 1850.',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }

    private function createTuDuongPhoto(): void
    {
        $path = 'tu-duong/vo-quoc/tu-duong.svg';
        if (Storage::disk('public')->exists($path)) {
            return;
        }

        $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720">
  <rect width="1200" height="720" fill="#f7f0df"/>
  <rect x="120" y="490" width="960" height="68" rx="34" fill="#d7be86"/>
  <path d="M180 362 L600 160 L1020 362 Z" fill="#8b5a2b"/>
  <path d="M260 362 L600 214 L940 362 Z" fill="#b8902c"/>
  <rect x="270" y="362" width="660" height="180" rx="22" fill="#fff8e8" stroke="#8b5a2b" stroke-width="12"/>
  <rect x="548" y="402" width="104" height="140" rx="12" fill="#8b5a2b"/>
  <rect x="344" y="410" width="118" height="76" rx="14" fill="#d7be86"/>
  <rect x="738" y="410" width="118" height="76" rx="14" fill="#d7be86"/>
  <text x="600" y="630" text-anchor="middle" font-family="serif" font-size="54" font-weight="700" fill="#5c3a1e">Từ đường dòng họ Võ Quốc</text>
</svg>
SVG;

        Storage::disk('public')->put($path, $svg);
    }
}
