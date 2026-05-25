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

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/google/url', [AuthController::class, 'googleUrl']);
    Route::post('/google/callback', [AuthController::class, 'googleCallback']);
    Route::post('/google/verify-otp', [AuthController::class, 'googleVerifyOtp']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::prefix('dong-ho')->group(function () {
    Route::get('/list', [DongHoController::class, 'index']);
    Route::post('/create', [DongHoController::class, 'store']);
    Route::post('/update', [DongHoController::class, 'update']);
    Route::post('/delete', [DongHoController::class, 'destroy']);
});

Route::prefix('nguoi')->group(function () {
    Route::get('/list', [NguoiController::class, 'index']);
    Route::get('/detail', [NguoiController::class, 'detail']);
    Route::post('/create', [NguoiController::class, 'store']);
    Route::post('/update', [NguoiController::class, 'update']);
    Route::post('/delete', [NguoiController::class, 'destroy']);
});

Route::prefix('nguoi-dung')->group(function () {
    Route::get('/list', [NguoiDungController::class, 'index']);
    Route::post('/create', [NguoiDungController::class, 'store']);
    Route::post('/update', [NguoiDungController::class, 'update']);
    Route::post('/delete', [NguoiDungController::class, 'destroy']);
});
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('onboarding')->group(function () {
        Route::get('/search-clan', [\App\Http\Controllers\Api\OnboardingController::class, 'searchClan']);
        Route::post('/join-clan', [\App\Http\Controllers\Api\OnboardingController::class, 'joinClan']);
        Route::post('/create-clan', [\App\Http\Controllers\Api\OnboardingController::class, 'createClan']);
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
        Route::get('/list', [\App\Http\Controllers\Api\DuyetThanhVienController::class, 'index']);
        Route::post('/process', [\App\Http\Controllers\Api\DuyetThanhVienController::class, 'process']);
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
    });

Route::prefix('su-kien')->group(function () {
    Route::get('/list', [SuKienController::class, 'index']);
    Route::post('/create', [SuKienController::class, 'store']);
    Route::post('/update', [SuKienController::class, 'update']);
    Route::post('/delete', [SuKienController::class, 'destroy']);
});

Route::prefix('tai-lieu')->group(function () {
    Route::get('/list', [TaiLieuController::class, 'index']);
    Route::post('/create', [TaiLieuController::class, 'store']);
    Route::post('/update', [TaiLieuController::class, 'update']);
    Route::post('/delete', [TaiLieuController::class, 'destroy']);
});

Route::prefix('quan-he')->group(function () {
    Route::get('/list', [QuanHeController::class, 'index']);
    Route::post('/create', [QuanHeController::class, 'store']);
    Route::post('/update', [QuanHeController::class, 'update']);
    Route::post('/delete', [QuanHeController::class, 'destroy']);
});

Route::prefix('cache-xung-ho')->group(function () {
    Route::get('/list', [CacheXungHoController::class, 'index']);
    Route::post('/create', [CacheXungHoController::class, 'store']);
    Route::post('/update', [CacheXungHoController::class, 'update']);
    Route::post('/delete', [CacheXungHoController::class, 'destroy']);
});
});
