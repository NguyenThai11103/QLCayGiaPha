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
