export interface NhanVien {
    id: number;
    email: string;
    ho_va_ten: string;
    ten_goi_nho: string;
    so_dien_thoai: string;
    anh_dai_dien: string | null;
    is_open: number;
    is_master: number;
    id_quyen: number;
    ten_quyen?: string;
    ngay_bat_dau_lam: string;
    ngay_sinh: string;
    luong_co_ban: number | null;
    is_luong_co_ban: number;
    created_at: string;
    updated_at: string;
}

export interface NhanVienFormData {
    email: string;
    ho_va_ten: string;
    ten_goi_nho: string;
    password?: string;
    so_dien_thoai: string;
    ngay_bat_dau_lam: string;
    ngay_sinh: string;
    id_quyen: number;
    is_master: number;
    is_open: number;
    luong_co_ban?: number | null;
    is_luong_co_ban?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}
