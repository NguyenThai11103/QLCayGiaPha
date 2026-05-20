// ─────────────────────────────────────────────
//  API Base Configuration
// ─────────────────────────────────────────────
export const BASE_URL = 'http://192.168.1.197:8000/api';

export const API_TIMEOUT = 15000; // 15s

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
