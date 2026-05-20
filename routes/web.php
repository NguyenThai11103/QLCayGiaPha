<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('landing/index');
});

Route::get('/login', function () {
    return Inertia::render('auth/login');
});

Route::get('/register', function () {
    return Inertia::render('auth/logout');
});

Route::get('/forgot-password', function () {
    return Inertia::render('auth/forgot-password');
});

Route::get('/gia-pha/dashboard', function () {
    return Inertia::render('dashboard/index');
});

Route::get('/gia-pha/thanh-vien', function () {
    return Inertia::render('thanh-vien/index');
});

Route::get('/gia-pha/cay-gia-pha', function () {
    return Inertia::render('gia-pha/index');
});

Route::get('/gia-pha/thanh-vien/{id}', function ($id) {
    return Inertia::render('chi-tiet-thanh-vien/index', ['id' => $id]);
});

Route::get('/gia-pha/tra-cuu-danh-xung', function () {
    return Inertia::render('tra-cuu-danh-xung/index');
});

Route::get('/gia-pha/events', function () {
    return Inertia::render('events/index');
});
