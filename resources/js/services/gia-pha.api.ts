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
    id_me?: number | null;
    id_vo_chong_list?: number[];
    id_vo_chong?: number | null; // Tương thích API cũ nếu có
    id_con?: number | null;
    tieu_su?: string | null;
};
export type NguoiUpdatePayload = Partial<NguoiPayload> & { id: number };

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

    async solarToLunar(solarDate: string) {
        const response = await apiClient.get<ApiResponse<{ lunar_date: string }>>('/su-kien/solar-to-lunar', {
            params: { solar_date: solarDate }
        });
        return response.data;
    },
};

// ─── Tài Liệu ────────────────────────────────────────────────────────────────

export interface TaiLieu {
    id              : number;
    dong_ho_id      : number | null;
    thanh_vien_id   : number | null;
    ten_tai_lieu?    : string | null;
    mo_ta?           : string | null;
    duong_dan_file  : string;
    ten_file_goc?    : string | null;
    loai_file       : string;
    mime_type?       : string | null;
    kich_thuoc?      : number | null;
    disk?            : string | null;
    path?            : string | null;
    nguoi_tai_len_id?: number | null;
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

    async create(payload: TaiLieuPayload | FormData) {
        const response = await apiClient.post<ApiResponse>('/tai-lieu/create', payload);
        return response.data;
    },

    async update(payload: TaiLieuUpdatePayload | FormData) {
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
    khu_mo_id?: number | null;
    vi_do: number;
    kinh_do: number;
    ghi_chu: string | null;
    anh_mo_path?: string | null;
    anh_mo_url?: string | null;
    nguoi_cap_nhat_id: number | null;
    ten_thanh_vien?: string | null;
    doi_thu?: number | null;
    tinh_trang_song?: number | null;
    ten_khu_mo?: string | null;
    dia_chi_khu_mo?: string | null;
    vi_do_khu_mo?: number | null;
    kinh_do_khu_mo?: number | null;
    ten_nguoi_cap_nhat?: string | null;
    created_at: string;
    updated_at: string;
}

export interface MoPhanPayload {
    thanh_vien_id: number;
    khu_mo_id?: number | null;
    vi_do: number;
    kinh_do: number;
    ghi_chu?: string | null;
    anh_mo?: File | null;
}

export type MoPhanUpdatePayload = Partial<Omit<MoPhanPayload, 'thanh_vien_id'>> & { id: number };

export interface MoPhanHistory {
    id: number;
    mo_phan_id: number;
    nguoi_cap_nhat_id: number | null;
    ten_nguoi_cap_nhat?: string | null;
    vi_do_cu: number | null;
    kinh_do_cu: number | null;
    vi_do_moi: number | null;
    kinh_do_moi: number | null;
    ghi_chu_cu: string | null;
    ghi_chu_moi: string | null;
    anh_mo_cu: string | null;
    anh_mo_moi: string | null;
    created_at: string;
    updated_at: string;
}

export interface KhuMo {
    id: number;
    dong_ho_id: number;
    ten_khu_mo: string;
    dia_chi: string | null;
    vi_do: number;
    kinh_do: number;
    mo_ta: string | null;
    anh_khu_mo_url?: string | null;
    nguoi_cap_nhat_id?: number | null;
    ten_nguoi_cap_nhat?: string | null;
    so_mo_phan?: number | null;
    created_at: string;
    updated_at: string;
}

export interface KhuMoPayload {
    id?: number;
    dong_ho_id?: number;
    ten_khu_mo: string;
    dia_chi?: string | null;
    vi_do: number;
    kinh_do: number;
    mo_ta?: string | null;
    anh_khu_mo?: File | null;
}

export interface OpenMapDirectionSummary {
    distanceText: string;
    durationText: string;
    startAddress?: string;
    endAddress?: string;
    steps: Array<{
        instruction: string;
        distanceText: string;
        durationText: string;
        maneuver?: string;
        location?: [number, number]; // [lng, lat]
    }>;
    overviewPolyline?: string;
    raw: any;
}

export type OpenMapVehicle = 'car' | 'bike' | 'motor' | 'taxi' | 'truck' | 'walking';

function moPhanFormData(payload: MoPhanPayload | MoPhanUpdatePayload) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        formData.append(key, value instanceof File ? value : String(value));
    });
    return formData;
}

function formDataFromObject(payload: Record<string, unknown>) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        formData.append(key, value instanceof File ? value : String(value));
    });
    return formData;
}

export const moPhanApi = {
    async list(params?: { dong_ho_id?: number | string; thanh_vien_id?: number | string; doi_thu?: number | string; khu_mo_id?: number | string }) {
        const response = await apiClient.get<ApiResponse<MoPhan[]>>('/mo-phan/list', { params });
        return response.data;
    },

    async detail(params: { id?: number | string; thanh_vien_id?: number | string }) {
        const response = await apiClient.get<ApiResponse<MoPhan>>('/mo-phan/detail', { params });
        return response.data;
    },

    async create(payload: MoPhanPayload) {
        const response = await apiClient.post<ApiResponse>('/mo-phan/create', moPhanFormData(payload));
        return response.data;
    },

    async update(payload: MoPhanUpdatePayload) {
        const response = await apiClient.post<ApiResponse>('/mo-phan/update', moPhanFormData(payload));
        return response.data;
    },

    async history(id: number | string) {
        const response = await apiClient.get<ApiResponse<MoPhanHistory[]>>('/mo-phan/history', { params: { id } });
        return response.data;
    },

    async delete(id: number) {
        const response = await apiClient.post<ApiResponse>('/mo-phan/delete', { id });
        return response.data;
    },
};

function directionSummary(raw: any): OpenMapDirectionSummary {
    const route = raw?.routes?.[0] || raw?.data?.routes?.[0] || null;
    const leg = route?.legs?.[0] || null;
    const distance = leg?.distance?.text || route?.distance?.text || (typeof route?.distance === 'number' ? `${(route.distance / 1000).toFixed(1)} km` : 'Chưa rõ');
    const duration = leg?.duration?.text || route?.duration?.text || (typeof route?.duration === 'number' ? `${Math.round(route.duration / 60)} phút` : 'Chưa rõ');
    const steps = Array.isArray(leg?.steps)
        ? leg.steps.map((step: any) => ({
            instruction  : String(step?.html_instructions || step?.instruction || 'Tiếp tục di chuyển').replace(/<[^>]*>/g, ''),
            distanceText : step?.distance?.text || 'Chưa rõ',
            durationText : step?.duration?.text || 'Chưa rõ',
            maneuver     : step?.maneuver || undefined,
            location     : step?.location || step?.maneuver?.location || undefined,
        }))
        : [];

    return {
        distanceText: distance,
        durationText: duration,
        startAddress: leg?.start_address || undefined,
        endAddress: leg?.end_address || undefined,
        steps,
        overviewPolyline: route?.overview_polyline?.points || route?.geometry || undefined,
        raw,
    };
}

export const khuMoApi = {
    async list(params?: { dong_ho_id?: number | string }) {
        const response = await apiClient.get<ApiResponse<KhuMo[]>>('/khu-mo/list', { params });
        return response.data;
    },

    async create(payload: KhuMoPayload) {
        const response = await apiClient.post<ApiResponse>('/khu-mo/create', formDataFromObject(payload as unknown as Record<string, unknown>));
        return response.data;
    },

    async update(payload: KhuMoPayload & { id: number }) {
        const response = await apiClient.post<ApiResponse>('/khu-mo/update', formDataFromObject(payload as unknown as Record<string, unknown>));
        return response.data;
    },

    async delete(id: number) {
        const response = await apiClient.post<ApiResponse>('/khu-mo/delete', { id });
        return response.data;
    },

    async direction(params: { origin: string; destination: string; vehicle?: OpenMapVehicle; alternatives?: boolean; admin_v2?: boolean }) {
        const response = await apiClient.get<ApiResponse<any>>('/khu-mo/direction', { params });
        return response.data.success ? { ...response.data, data: directionSummary(response.data.data) } : response.data;
    },
};
