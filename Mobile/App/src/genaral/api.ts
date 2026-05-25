import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────
export const BASE_URL         = 'http://192.168.1.197:8000/api';
export const STORAGE_TOKEN_KEY = 'auth_token';
export const API_TIMEOUT       = 15000; // 15s

/**
 * Wrapper fetch với timeout và xử lý lỗi chung.
 */
export async function apiFetch<T>(
  endpoint : string,
  options  : RequestInit = {},
  token?   : string,
): Promise<T> {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), API_TIMEOUT);

  const headers: Record<string, string> = {
    'Content-Type' : 'application/json',
    'Accept'       : 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal : controller.signal,
    });

    const json = await response.json();

    if (!response.ok) {
      // Xử lý 401: xóa token cũ để buộc login lại
      if (response.status === 401) {
        await AsyncStorage.removeItem('auth_token').catch(() => {});
        throw { status: 401, message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', isUnauthorized: true };
      }
      throw {
        status  : response.status,
        message : json?.message ?? 'Đã xảy ra lỗi từ máy chủ',
        data    : json,
      };
    }

    return json as T;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw { status: 408, message: 'Kết nối quá thời gian, vui lòng thử lại' };
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
