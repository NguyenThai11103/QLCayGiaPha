import apiClient from '@/lib/api.client';

export interface AdminDongHo {
    id: number;
    ten_dong_ho: string;
    tieu_su: string | null;
    loi_gioi_thieu: string | null;
    logo_path: string | null;
    trang_thai: number;
    nguoi_tao: number | null;
    created_at: string;
    nguoi_dungs_count?: number;
}

export interface AdminNguoiDung {
    id: number;
    ho_ten: string;
    email: string;
    avatar: string | null;
    quyen_han: string;
    trang_thai: number;
    dong_ho_id: number | null;
    created_at: string;
    dong_ho?: {
        id: number;
        ten_dong_ho: string;
    } | null;
}

export interface PaginatedResponse<T> {
    current_page: number;
    data: T[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

export interface BaseApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}

export const adminDongHoApi = {
    list: async (params?: Record<string, any>) => {
        const response = await apiClient.get<BaseApiResponse<PaginatedResponse<AdminDongHo>>>('/admin/dong-ho/list', { params });
        return response.data;
    },
    updateStatus: async (id: number, trang_thai: boolean) => {
        const response = await apiClient.patch<BaseApiResponse<AdminDongHo>>(`/admin/dong-ho/${id}/status`, { trang_thai });
        return response.data;
    },
    delete: async (id: number) => {
        const response = await apiClient.delete<BaseApiResponse<null>>(`/admin/dong-ho/${id}`);
        return response.data;
    }
};

export const adminNguoiDungApi = {
    list: async (params?: Record<string, any>) => {
        const response = await apiClient.get<BaseApiResponse<PaginatedResponse<AdminNguoiDung>>>('/admin/nguoi-dung/list', { params });
        return response.data;
    },
    updateStatus: async (id: number, trang_thai: boolean) => {
        const response = await apiClient.patch<BaseApiResponse<AdminNguoiDung>>(`/admin/nguoi-dung/${id}/status`, { trang_thai });
        return response.data;
    },
    delete: async (id: number) => {
        const response = await apiClient.delete<BaseApiResponse<null>>(`/admin/nguoi-dung/${id}`);
        return response.data;
    }
};
