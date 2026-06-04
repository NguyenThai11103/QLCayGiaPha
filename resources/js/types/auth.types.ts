import type { DongHo } from '../services/gia-pha.api';

export interface NhanVien {
    id: number;
    email: string;
    ho_va_ten: string;
    ten_goi_nho: string;
    so_dien_thoai: string;
    anh_dai_dien: string | null;
    tieu_su?: string | null;
    quyen_han: 'admin' | 'truong_toc' | 'quan_ly' | 'thanh_vien' | string | null;
    is_master?: number | boolean | null;
    dong_ho_id?: number | null;
    trang_thai_gia_nhap?: string | null;
    ngay_bat_dau_lam?: string;
    ngay_sinh?: string;
    ten_chuc_vu?: string;
    thanh_vien_id?: number | null;
    dong_ho?: DongHo | null;
    google_id?: string | null;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        token: string;
        user: NhanVien;
    };
}

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
}

export interface AuthContextType {
    user: NhanVien | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}
