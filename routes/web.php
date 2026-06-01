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

Route::get('/admin/login', function () {
    return Inertia::render('admin/auth/login');
})->name('admin.login');

Route::get('/admin/dashboard', function () {
    return Inertia::render('admin/dashboard/index');
});

Route::get('/admin/dong-ho', function () {
    return Inertia::render('admin/dong-ho/index');
});

Route::get('/admin/nguoi-dung', function () {
    return Inertia::render('admin/nguoi-dung/index');
});

Route::get('/admin/thanh-vien', function () {
    return Inertia::render('admin/thanh-vien/index');
});

Route::get('/admin/thanh-vien/{id}', function ($id) {
    return Inertia::render('client/chi-tiet-thanh-vien/index', ['id' => $id]);
});

Route::get('/onboarding', function () {
    return Inertia::render('client/onboarding/index');
});

Route::get('/gia-pha/dashboard', function () {
    return Inertia::render('client/dashboard/index');
});

Route::get('/gia-pha/thanh-vien', function () {
    return Inertia::render('client/thanh-vien/index');
});

Route::get('/gia-pha/cho-duyet', function () {
    return Inertia::render('client/cho-duyet/index');
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

Route::get('/gia-pha/events', function () {
    return Inertia::render('client/events/index');
});

Route::get('/profile', function () {
    return Inertia::render('profile/index');
});

Route::get('/admin/profile', function () {
    return Inertia::render('profile/index');
});

Route::get('/gia-pha/tai-lieu', function () {
    return Inertia::render('client/tai-lieu/index');
});

Route::get('/gia-pha/mo-phan', function () {
    return Inertia::render('client/mo-phan/index');
});
