import axios, { AxiosError, AxiosInstance } from 'axios';
import { getErrorMessage } from './error-codes';
import toast from './toast.util';
import { tokenStorage } from './token.storage';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// Request interceptor to add token
apiClient.interceptors.request.use(
    (config) => {
        const scope = window.location.pathname.startsWith('/admin') ? 'admin' : 'user';
        const token = tokenStorage.getToken(scope);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// Response interceptor to handle 401 errors
apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const errorData = error.response?.data as any;

        // 1. Try to get specific error code or message
        let errorMessage = errorData?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';

        // 2. If there's an error_code, use it to lookup friendly message
        if (errorData?.error_code) {
            errorMessage = getErrorMessage(errorData.error_code);
        } else if (errorData?.errors) {
            // 3. Handle validation errors (Laravel style: errors: { field: ['msg'] })
            const firstField = Object.keys(errorData.errors)[0];
            if (firstField && errorData.errors[firstField]?.[0]) {
                errorMessage = errorData.errors[firstField][0];
            }
        }

        // 4. Show toast if it's not a login 401 redirect (which is handled separately or below)
        // Note: keeping the 401 check for login page redirect if needed, but per request we toast everything.
        // If 401 and NOT login page, we might redirect AND toast.

        // Special handling for 401 (Unauthorized)
        if (error.response?.status === 401) {
            const isAdminPath = window.location.pathname.startsWith('/admin');
            const loginUrl = isAdminPath ? '/admin/auth/login' : '/auth/login';

            if (error.config?.url !== loginUrl) {
                tokenStorage.removeToken(isAdminPath ? 'admin' : 'user');
                document.cookie = `${isAdminPath ? 'admin_auth_token' : 'user_auth_token'}=; path=/; max-age=0`;
                document.cookie = 'auth_token=; path=/; max-age=0';
                window.location.href = isAdminPath ? '/admin/login' : '/login';
                return Promise.reject(error); // Redirecting, so maybe no toast needed? Or toast "Session expired"?
            }
            // If it IS login, we definitely want to show the error (handled by general logic below)
        }

        // Show error toast
        toast.error(errorMessage);

        return Promise.reject(error);
    },
);

export default apiClient;
