<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\NguoiController;
use App\Http\Controllers\Api\DongHoController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

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
