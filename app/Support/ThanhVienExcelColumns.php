<?php

namespace App\Support;

class ThanhVienExcelColumns
{
    public const HEADINGS = [
        'ma_thanh_vien',
        'ho_ten',
        'ten_thuong_goi',
        'gioi_tinh',
        'doi_thu',
        'thu_tu_sinh',
        'tinh_trang_song',
        'ngay_sinh_duong',
        'ngay_sinh_am',
        'nam_sinh_uoc_tinh',
        'ngay_mat_am',
        'nghe_nghiep',
        'dia_chi',
        'cho_o_hien_tai',
        'tieu_su',
        'ma_cha',
        'ma_me',
        'ma_vo_chong',
    ];

    public static function guideRows(): array
    {
        return [
            ['ma_thanh_vien', 'Khong bat buoc', 'De trong de he thong tu tao ma. Neu co ma trung trong dong ho, dong nay se cap nhat ho so do.'],
            ['ho_ten', 'Bat buoc', 'Ho va ten thanh vien.'],
            ['ten_thuong_goi', 'Khong bat buoc', 'Ten goi khac hoac biet danh.'],
            ['gioi_tinh', 'Khong bat buoc', 'Nhap nam hoac nu. Mac dinh la nam neu de trong.'],
            ['doi_thu', 'Khong bat buoc', 'So doi thu trong cay gia pha.'],
            ['thu_tu_sinh', 'Khong bat buoc', 'Thu tu sinh trong anh chi em.'],
            ['tinh_trang_song', 'Khong bat buoc', 'Nhap con_song hoac da_mat. Mac dinh la con_song.'],
            ['ngay_sinh_duong', 'Khong bat buoc', 'Dinh dang YYYY-MM-DD, vi du 1980-04-30.'],
            ['ngay_sinh_am', 'Khong bat buoc', 'Dinh dang YYYY-MM-DD neu da co ngay am lich.'],
            ['nam_sinh_uoc_tinh', 'Khong bat buoc', 'Nam sinh uoc tinh khi khong ro ngay sinh.'],
            ['ngay_mat_am', 'Khong bat buoc', 'Dinh dang YYYY-MM-DD neu thanh vien da mat.'],
            ['nghe_nghiep', 'Khong bat buoc', 'Nghe nghiep cua thanh vien.'],
            ['dia_chi', 'Khong bat buoc', 'Dia chi que quan hoac dia chi ghi chep.'],
            ['cho_o_hien_tai', 'Khong bat buoc', 'Noi o hien tai.'],
            ['tieu_su', 'Khong bat buoc', 'Ghi chu, tieu su ngan.'],
            ['ma_cha', 'Khong bat buoc', 'Ma thanh vien cua cha trong cung dong ho.'],
            ['ma_me', 'Khong bat buoc', 'Ma thanh vien cua me trong cung dong ho.'],
            ['ma_vo_chong', 'Khong bat buoc', 'Mot hoac nhieu ma vo/chong, cach nhau bang dau phay.'],
        ];
    }
}
