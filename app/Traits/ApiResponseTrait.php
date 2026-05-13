<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponseTrait
{
    /**
     * Return a success response
     */
    protected function successResponse(string $message = '', array $data = [], int $statusCode = 200): JsonResponse
    {
        $response = [
            'success' => true,
        ];

        if (!empty($message)) {
            $response['message'] = $message;
        }

        if (!empty($data)) {
            $response['data'] = $data;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Return an error response with error code
     */
    protected function errorResponse(string $errorCode, int $statusCode = 400, array $errors = []): JsonResponse
    {
        $response = [
            'success'    => false,
            'error_code' => $errorCode,
        ];

        if (!empty($errors)) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Return a data response (success with data)
     */
    protected function dataResponse(array $data, string $message = '', int $statusCode = 200): JsonResponse
    {
        return $this->successResponse($message, $data, $statusCode);
    }

    /**
     * Format user data for API response
     */
    protected function formatUserData($user, bool $includeExtraFields = false): array
    {
        $data = [
            'id'            => $user->id,
            'email'         => $user->email,
            'ho_va_ten'     => $user->ho_va_ten,
            'ten_goi_nho'   => $user->ten_goi_nho,
            'so_dien_thoai' => $user->so_dien_thoai,
            'anh_dai_dien'  => $user->anh_dai_dien,
            'is_master'     => $user->is_master,
            'id_quyen'      => $user->id_quyen,
            'ten_chuc_vu'   => $user->is_master ? 'Master Admin' : ($user->quyen->ten_quyen ?? 'Nhân viên'),
        ];

        if ($includeExtraFields) {
            $data['ngay_bat_dau_lam'] = $user->ngay_bat_dau_lam;
            $data['ngay_sinh']        = $user->ngay_sinh;
        }

        return $data;
    }
}
