<?php

namespace App\Constants;

class ErrorCode
{
    // Authentication & Validation Errors (DZ001-DZ099)
    public const EMAIL_REQUIRED       = 'DZ001'; // Email required
    public const EMAIL_INVALID        = 'DZ002'; // Invalid email format
    public const PASSWORD_REQUIRED    = 'DZ003'; // Password required
    public const PASSWORD_TOO_SHORT   = 'DZ004'; // Password too short
    public const INVALID_CREDENTIALS  = 'DZ005'; // Invalid credentials
    public const ACCOUNT_DISABLED     = 'DZ006'; // Account disabled
    public const UNAUTHORIZED         = 'DZ007'; // Unauthorized access
    public const TOKEN_EXPIRED        = 'DZ008'; // Token expired
    public const TOKEN_INVALID        = 'DZ009'; // Invalid token

    // Resource Errors (DZ100-DZ199)
    public const RESOURCE_NOT_FOUND   = 'DZ100'; // Resource not found
    public const RESOURCE_EXISTS      = 'DZ101'; // Resource already exists

    // Permission Errors (DZ200-DZ299)
    public const PERMISSION_DENIED    = 'DZ200'; // Permission denied
    public const INSUFFICIENT_RIGHTS  = 'DZ201'; // Insufficient rights
    public const DELETE_MASTER_DENIED = 'DZ202'; // Cannot delete master account

    // Validation Errors (DZ300-DZ399)
    public const VALIDATION_FAILED    = 'DZ300'; // Validation failed
    public const INVALID_INPUT        = 'DZ301'; // Invalid input data

    // Server Errors (DZ500-DZ599)
    public const SERVER_ERROR         = 'DZ500'; // Internal server error
    public const SERVICE_UNAVAILABLE  = 'DZ501'; // Service unavailable

    /**
     * Get error code description (for development/debugging)
     */
    public static function getDescription(string $code): string
    {
        $descriptions = [
            self::EMAIL_REQUIRED      => 'Email là bắt buộc',
            self::EMAIL_INVALID       => 'Định dạng email không hợp lệ',
            self::PASSWORD_REQUIRED   => 'Mật khẩu là bắt buộc',
            self::PASSWORD_TOO_SHORT  => 'Mật khẩu quá ngắn',
            self::INVALID_CREDENTIALS => 'Thông tin đăng nhập không chính xác',
            self::ACCOUNT_DISABLED    => 'Tài khoản đã bị vô hiệu hóa',
            self::UNAUTHORIZED        => 'Không có quyền truy cập',
            self::TOKEN_EXPIRED       => 'Token xác thực đã hết hạn',
            self::TOKEN_INVALID       => 'Token xác thực không hợp lệ',
            self::RESOURCE_NOT_FOUND  => 'Không tìm thấy tài nguyên',
            self::RESOURCE_EXISTS     => 'Tài nguyên đã tồn tại',
            self::PERMISSION_DENIED   => 'Không có quyền thực hiện',
            self::INSUFFICIENT_RIGHTS => 'Không đủ quyền hạn để thực hiện hành động này',
            self::DELETE_MASTER_DENIED => 'Không thể xóa tài khoản Master',
            self::VALIDATION_FAILED   => 'Xác thực thất bại',
            self::INVALID_INPUT       => 'Dữ liệu đầu vào không hợp lệ',
            self::SERVER_ERROR        => 'Lỗi máy chủ nội bộ',
            self::SERVICE_UNAVAILABLE => 'Dịch vụ tạm thời không khả dụng',
        ];

        return $descriptions[$code] ?? 'Mã lỗi không xác định';
    }
}
