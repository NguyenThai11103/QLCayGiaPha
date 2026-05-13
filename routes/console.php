<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Nhắc nhở deadline task mỗi ngày lúc 8:00 sáng
Schedule::command('task:remind-deadline')->dailyAt('08:00');

// Báo cáo lịch làm việc hằng ngày lúc 7:00 sáng
Schedule::command('lich-lam-viec:send-report')->dailyAt('07:00');
