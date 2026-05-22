<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('landing/index');
});

Route::get('/login', function () {
    return Inertia::render('auth/login');
})->name('login');

Route::get('/register', function () {
    return Inertia::render('auth/register');
});

Route::get('/forgot-password', function () {
    return Inertia::render('auth/forgot-password');
});

Route::get('/auth/google/callback', function () {
    return Inertia::render('auth/google-callback');
});

Route::get('/reset-password', function () {
    return Inertia::render('auth/reset-password');
});

use Illuminate\Http\Request;

Route::get('/gia-pha/dashboard', function (Request $request) {
    if ($request->user() && $request->user()->is_master === 1) {
        return Inertia::render('admin/dashboard/index');
    }
    return Inertia::render('client/dashboard/index');
});

Route::get('/gia-pha/thanh-vien', function (Request $request) {
    if ($request->user() && $request->user()->is_master === 1) {
        return Inertia::render('admin/thanh-vien/index');
    }
    return Inertia::render('client/thanh-vien/index');
});

Route::get('/gia-pha/cay-gia-pha', function () {
    return Inertia::render('client/gia-pha/index');
});

Route::get('/gia-pha/thanh-vien/{id}', function ($id) {
    return Inertia::render('client/chi-tiet-thanh-vien/index', ['id' => $id]);
});

Route::get('/gia-pha/tra-cuu-danh-xung', function () {
    return Inertia::render('client/tra-cuu-danh-xung/index');
});

Route::get('/gia-pha/test-qr', function () {
    return Inertia::render('client/test-qr/index');
});

Route::get('/gia-pha/events', function () {
    return Inertia::render('client/events/index');
});

