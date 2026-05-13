<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('gia-pha/index');
});

Route::get('/gia-pha/dashboard', function () {
    return Inertia::render('gia-pha/index');
});

Route::get('/gia-pha/thanh-vien', function () {
    return Inertia::render('gia-pha/thanh-vien');
});

Route::get('/gia-pha/cay-gia-pha', function () {
    return Inertia::render('gia-pha/cay-gia-pha');
});

Route::get('/gia-pha/thanh-vien/{id}', function ($id) {
    return Inertia::render('gia-pha/chi-tiet-thanh-vien', ['id' => $id]);
});

Route::get('/gia-pha/tra-cuu-danh-xung', function () {
    return Inertia::render('gia-pha/tra-cuu-danh-xung');
});
