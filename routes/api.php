<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\NguoiController;
use App\Http\Controllers\Api\DongHoController;
use App\Http\Controllers\Api\NguoiDungController;
use App\Http\Controllers\Api\SuKienController;
use App\Http\Controllers\Api\TaiLieuController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\QuanHeController;
use App\Http\Controllers\Api\CacheXungHoController;
use App\Http\Controllers\Api\MoPhanController;
use App\Http\Controllers\Api\DuyetThanhVienController;
use App\Http\Controllers\Api\OnboardingController;
use App\Http\Controllers\Api\Admin\AuthController as AdminAuthController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/google/url', [AuthController::class, 'googleUrl']);
    Route::post('/google/callback', [AuthController::class, 'googleCallback']);
    Route::post('/google/verify-otp', [AuthController::class, 'googleVerifyOtp']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/update-profile', [AuthController::class, 'updateProfile']);
        Route::post('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });
});

Route::prefix('admin/auth')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AdminAuthController::class, 'me']);
        Route::post('/logout', [AdminAuthController::class, 'logout']);
    });
});

Route::prefix('admin')->middleware(['auth:sanctum', 'check.admin.system'])->group(function () {
    Route::prefix('dong-ho')->group(function () {
        Route::get('/list', [\App\Http\Controllers\Api\Admin\AdminDongHoController::class, 'index']);
        Route::patch('/{id}/status', [\App\Http\Controllers\Api\Admin\AdminDongHoController::class, 'updateStatus']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\Admin\AdminDongHoController::class, 'destroy']);
    });
    
    Route::prefix('nguoi-dung')->group(function () {
        Route::get('/list', [\App\Http\Controllers\Api\Admin\AdminNguoiDungController::class, 'index']);
        Route::patch('/{id}/status', [\App\Http\Controllers\Api\Admin\AdminNguoiDungController::class, 'updateStatus']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\Admin\AdminNguoiDungController::class, 'destroy']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    
    Route::prefix('onboarding')->group(function () {
        Route::get('/search-clan', [OnboardingController::class, 'searchClan']);
        Route::post('/join-clan', [OnboardingController::class, 'joinClan']);
        Route::post('/create-clan', [OnboardingController::class, 'createClan']);
    });

    Route::prefix('dong-ho')->group(function () {
        Route::get('/list', [DongHoController::class, 'index']);
        Route::post('/create', [DongHoController::class, 'store'])->middleware('check.permission:system_admin');
        Route::post('/update', [DongHoController::class, 'update'])->middleware('check.permission:quan_ly');
        Route::post('/delete', [DongHoController::class, 'destroy'])->middleware('check.permission:system_admin');
    });

    Route::prefix('nguoi')->group(function () {
        Route::get('/list', [NguoiController::class, 'index']);
        Route::get('/detail', [NguoiController::class, 'detail']);
        Route::post('/create', [NguoiController::class, 'store'])->middleware('check.permission:quan_ly');
        Route::post('/update', [NguoiController::class, 'update'])->middleware('check.permission:quan_ly');
        Route::post('/delete', [NguoiController::class, 'destroy'])->middleware('check.permission:quan_ly');
    });

    Route::prefix('cho-duyet')->middleware('check.permission:quan_ly')->group(function () {
        Route::get('/list', [DuyetThanhVienController::class, 'index']);
        Route::post('/process', [DuyetThanhVienController::class, 'process']);
    });

    Route::prefix('nguoi-dung')->middleware('check.permission:quan_ly')->group(function () {
        Route::get('/list', [NguoiDungController::class, 'index']);
        Route::post('/create', [NguoiDungController::class, 'store']);
        Route::post('/update', [NguoiDungController::class, 'update']);
        Route::post('/delete', [NguoiDungController::class, 'destroy']);
    });

    Route::prefix('su-kien')->group(function () {
        Route::get('/list', [SuKienController::class, 'index']);
        Route::post('/create', [SuKienController::class, 'store'])->middleware('check.permission:quan_ly');
        Route::post('/update', [SuKienController::class, 'update'])->middleware('check.permission:quan_ly');
        Route::post('/delete', [SuKienController::class, 'destroy'])->middleware('check.permission:quan_ly');
        Route::post('/attend', [SuKienController::class, 'attend']);
        Route::post('/leave', [SuKienController::class, 'leave']);
    });

    Route::prefix('tai-lieu')->group(function () {
        Route::get('/list', [TaiLieuController::class, 'index']);
        Route::post('/create', [TaiLieuController::class, 'store'])->middleware('check.permission:quan_ly');
        Route::post('/update', [TaiLieuController::class, 'update'])->middleware('check.permission:quan_ly');
        Route::post('/delete', [TaiLieuController::class, 'destroy'])->middleware('check.permission:quan_ly');
    });

    Route::prefix('quan-he')->group(function () {
        Route::get('/list', [QuanHeController::class, 'index']);
        Route::post('/create', [QuanHeController::class, 'store'])->middleware('check.permission:quan_ly');
        Route::post('/update', [QuanHeController::class, 'update'])->middleware('check.permission:quan_ly');
        Route::post('/delete', [QuanHeController::class, 'destroy'])->middleware('check.permission:quan_ly');
    });

    Route::prefix('cache-xung-ho')->group(function () {
        Route::get('/list', [CacheXungHoController::class, 'index']);
        Route::post('/create', [CacheXungHoController::class, 'store'])->middleware('check.permission:quan_ly');
        Route::post('/update', [CacheXungHoController::class, 'update'])->middleware('check.permission:quan_ly');
        Route::post('/delete', [CacheXungHoController::class, 'destroy'])->middleware('check.permission:quan_ly');
    });

    Route::prefix('mo-phan')->group(function () {
        Route::get('/list', [MoPhanController::class, 'index']);
        Route::get('/detail', [MoPhanController::class, 'detail']);
        Route::post('/create', [MoPhanController::class, 'store']);
        Route::post('/update', [MoPhanController::class, 'update']);
        Route::post('/delete', [MoPhanController::class, 'destroy'])->middleware('check.permission:quan_ly');
    });

    Route::prefix('notifications')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\ThongBaoController::class, 'index']);
        Route::post('/read', [\App\Http\Controllers\Api\ThongBaoController::class, 'read']);
        Route::post('/read-all', [\App\Http\Controllers\Api\ThongBaoController::class, 'readAll']);
    });
});

