import apiClient from '@/lib/api.client';

export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    id?: number;
}

export interface DongHo {
    id: number;
    ten_dong_ho: string;
    mo_ta: string | null;
    gia_huan?: string | null;
    loi_gioi_thieu?: string | null;
    dia_chi_tu_duong?: string | null;
    logo_path?: string | null;
    anh_tu_duong_path?: string | null;
    theme_color?: 'gold' | 'crimson' | 'jade' | 'indigo' | 'bronze' | null;
}

export interface Nguoi {
    id: number;
    id_dong_ho: number;
    ten_day_du: string;
    gioi_tinh: 'nam' | 'nu';
    ngay_sinh: string | null;
    ngay_mat: string | null;
    da_mat: boolean | number;
    id_cha: number | null;
    id_me: number | null;
    tieu_su: string | null;
    anh_dai_dien: string | null;
    thu_tu_sinh: number | null;
    vo_chong_ids?: number[];
    doi_thu?: number | null;
}

export type NguoiPayload = Omit<Nguoi, 'id' | 'vo_chong_ids'> & {
    id_vo_chong_list?: number[];
    id_vo_chong?: number | null; // Tương thích API cũ nếu có
    id_con?: number | null;
};
export type NguoiUpdatePayload = Partial<NguoiPayload> & { id: number };

export interface NguoiDung {
    id: number;
    ho_ten: string;
    email: string;
    avatar?: string | null;
    quyen_han: string;
    trang_thai: number;
    dong_ho_id?: number | null;
    created_at?: string;
    updated_at?: string;
}

export const dongHoApi = {
    async list() {
        const response = await apiClient.get<ApiResponse<DongHo[]>>('/dong-ho/list');
        return response.data;
    },
};

export const nguoiDungApi = {
    list: (params?: Record<string, any>) => apiClient.get('/nguoi-dung/list', { params }),
    create: (data: Partial<NguoiDung>) => apiClient.post('/nguoi-dung/create', data),
    update: (data: Partial<NguoiDung>) => apiClient.post('/nguoi-dung/update', data),
    delete: (id: number) => apiClient.post('/nguoi-dung/delete', { id }),
};

export const choDuyetApi = {
    async list() {
        const response = await apiClient.get('/cho-duyet/list');
        return response.data;
    },
    async process(userId: number, action: 'approve' | 'reject', extraData?: any) {
        const payload = { user_id: userId, action, ...extraData };
        const response = await apiClient.post('/cho-duyet/process', payload);
        return response.data;
    }
};

export const nguoiApi = {
    async list(idDongHo?: number | string) {
        const response = await apiClient.get<ApiResponse<Nguoi[]>>('/nguoi/list', {
            params: idDongHo ? { id_dong_ho: idDongHo } : undefined,
        });
        return response.data;
    },

    async create(payload: NguoiPayload) {
        const response = await apiClient.post<ApiResponse>('/nguoi/create', payload);
        return response.data;
    },

    async update(payload: NguoiUpdatePayload) {
        const response = await apiClient.post<ApiResponse>('/nguoi/update', payload);
        return response.data;
    },

    async delete(id: number) {
        const response = await apiClient.post<ApiResponse>('/nguoi/delete', { id });
        return response.data;
    },
};

// ─── Sự Kiện ─────────────────────────────────────────────────────────────────

export interface SuKien {
    id                : number;
    dong_ho_id        : number;
    thanh_vien_id     ?: number | null;
    thanh_vien        ?: any;
    ten_su_kien       : string;
    loai_su_kien      : string | null;
    ngay_duong        : string | null;  // ISO date yyyy-mm-dd
    ngay_am           : string | null;  // ISO date yyyy-mm-dd (âm lịch)
    next_date         ?: string | null; // Calculated future/current occurrence
    lap_lai_hang_nam  : boolean;
    dia_diem          : string | null;
    mo_ta             : string | null;
    participants_count?: number;
    is_attending      ?: boolean;
    created_at        : string;
    updated_at        : string;
}

export type SuKienPayload = Omit<SuKien, 'id' | 'created_at' | 'updated_at' | 'thanh_vien' | 'next_date' | 'participants_count' | 'is_attending'>;
export type SuKienUpdatePayload = Partial<SuKienPayload> & { id: number };

export const suKienApi = {
    async list(dongHoId?: number | string) {
        const response = await apiClient.get<ApiResponse<SuKien[]>>('/su-kien/list', {
            params: dongHoId ? { dong_ho_id: dongHoId } : undefined,
        });
        return response.data;
    },

    async create(payload: SuKienPayload) {
        const response = await apiClient.post<ApiResponse>('/su-kien/create', payload);
        return response.data;
    },

    async update(payload: SuKienUpdatePayload) {
        const response = await apiClient.post<ApiResponse>('/su-kien/update', payload);
        return response.data;
    },

    async delete(id: number) {
        const response = await apiClient.post<ApiResponse>('/su-kien/delete', { id });
        return response.data;
    },

    async attend(id: number, so_nguoi_di_cung: number = 0, ghi_chu: string = '') {
        const response = await apiClient.post<ApiResponse>('/su-kien/attend', { id, so_nguoi_di_cung, ghi_chu });
        return response.data;
    },

    async leave(id: number) {
        const response = await apiClient.post<ApiResponse>('/su-kien/leave', { id });
        return response.data;
    },
};

// ─── Tài Liệu ────────────────────────────────────────────────────────────────

export interface TaiLieu {
    id              : number;
    dong_ho_id      : number | null;
    thanh_vien_id   : number | null;
    duong_dan_file  : string;
    loai_file       : string;
    du_lieu_orc     : string | null;
    created_at      : string;
    updated_at      : string;
}

export type TaiLieuPayload = Omit<TaiLieu, 'id' | 'created_at' | 'updated_at'>;
export type TaiLieuUpdatePayload = Partial<TaiLieuPayload> & { id: number };

export const taiLieuApi = {
    async list(params?: { dong_ho_id?: number | string; thanh_vien_id?: number | string }) {
        const response = await apiClient.get<ApiResponse<TaiLieu[]>>('/tai-lieu/list', { params });
        return response.data;
    },

    async create(payload: TaiLieuPayload) {
        const response = await apiClient.post<ApiResponse>('/tai-lieu/create', payload);
        return response.data;
    },

    async update(payload: TaiLieuUpdatePayload) {
        const response = await apiClient.post<ApiResponse>('/tai-lieu/update', payload);
        return response.data;
    },

    async delete(id: number) {
        const response = await apiClient.post<ApiResponse>('/tai-lieu/delete', { id });
        return response.data;
    },
};

// Mo Phan

export interface MoPhan {
    id: number;
    dong_ho_id: number;
    thanh_vien_id: number;
    vi_do: number;
    kinh_do: number;
    ghi_chu: string | null;
    nguoi_cap_nhat_id: number | null;
    ten_thanh_vien?: string | null;
    tinh_trang_song?: number | null;
    ten_nguoi_cap_nhat?: string | null;
    created_at: string;
    updated_at: string;
}

export interface MoPhanPayload {
    thanh_vien_id: number;
    vi_do: number;
    kinh_do: number;
    ghi_chu?: string | null;
}

export type MoPhanUpdatePayload = Partial<Omit<MoPhanPayload, 'thanh_vien_id'>> & { id: number };

export const moPhanApi = {
    async list(params?: { dong_ho_id?: number | string; thanh_vien_id?: number | string }) {
        const response = await apiClient.get<ApiResponse<MoPhan[]>>('/mo-phan/list', { params });
        return response.data;
    },

    async detail(params: { id?: number | string; thanh_vien_id?: number | string }) {
        const response = await apiClient.get<ApiResponse<MoPhan>>('/mo-phan/detail', { params });
        return response.data;
    },

    async create(payload: MoPhanPayload) {
        const response = await apiClient.post<ApiResponse>('/mo-phan/create', payload);
        return response.data;
    },

    async update(payload: MoPhanUpdatePayload) {
        const response = await apiClient.post<ApiResponse>('/mo-phan/update', payload);
        return response.data;
    },

    async delete(id: number) {
        const response = await apiClient.post<ApiResponse>('/mo-phan/delete', { id });
        return response.data;
    },
};
