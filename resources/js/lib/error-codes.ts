// Error code mapping for authentication
export const AUTH_ERROR_CODES: Record<string, string> = {
    // Validation errors
    DZ001: 'Email là bắt buộc',
    DZ002: 'Email không hợp lệ',
    DZ003: 'Mật khẩu là bắt buộc',
    DZ004: 'Mật khẩu phải có ít nhất 6 ký tự',

    // Authentication errors
    DZ005: 'Thông tin đăng nhập không chính xác',
    DZ006: 'Tài khoản đã bị vô hiệu hóa',

    // Default error
    DEFAULT: 'Đã xảy ra lỗi. Vui lòng thử lại.',
};

export function getErrorMessage(errorCode: string): string {
    return AUTH_ERROR_CODES[errorCode] || errorCode;
}
