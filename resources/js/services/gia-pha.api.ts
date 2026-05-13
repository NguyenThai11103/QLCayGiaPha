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
    vo_chong_ids?: number[];
}

export type NguoiPayload = Omit<Nguoi, 'id' | 'vo_chong_ids'> & {
    id_vo_chong?: number | null;
};
export type NguoiUpdatePayload = Partial<NguoiPayload> & { id: number };

export const dongHoApi = {
    async list() {
        const response = await apiClient.get<ApiResponse<DongHo[]>>('/dong-ho/list');
        return response.data;
    },
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
