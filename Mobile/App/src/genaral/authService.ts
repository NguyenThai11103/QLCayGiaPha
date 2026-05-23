import { apiFetch } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────
export interface LoginPayload {
  email    : string;
  password : string;
}

export interface NguoiDung {
  id         : number;
  ho_ten       : string;
  email      : string;
  dong_ho    : string | null;
  created_at : string;
  updated_at : string;
}

export interface LoginResponse {
  success : boolean;
  message : string;
  data    : {
    user  : NguoiDung;
    token : string;
  };
}

// ─────────────────────────────────────────────
//  Storage keys
// ─────────────────────────────────────────────
export const STORAGE_TOKEN_KEY = 'auth_token';
export const STORAGE_USER_KEY  = 'auth_user';

// ─────────────────────────────────────────────
//  Auth API
// ─────────────────────────────────────────────

/**
 * POST /auth/login
 * Đăng nhập và lưu token + user vào AsyncStorage.
 */
export async function loginApi(payload: LoginPayload): Promise<LoginResponse> {
  const response = await apiFetch<LoginResponse>('/auth/login', {
    method : 'POST',
    body   : JSON.stringify(payload),
  });

  // Lưu token và thông tin user
  await Promise.all([
    AsyncStorage.setItem(STORAGE_TOKEN_KEY, response.data.token),
    AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(response.data.user)),
  ]);

  return response;
}

/**
 * Lấy token đang lưu trong storage.
 */
export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_TOKEN_KEY);
}

/**
 * Xoá token và user khi logout.
 */
export async function logoutApi(): Promise<void> {
  await AsyncStorage.multiRemove([STORAGE_TOKEN_KEY, STORAGE_USER_KEY]);
}
