<?php

namespace App\Support;

use Carbon\Carbon;
use LucNham\LunarCalendar\LunarDateTime;

class LunarSolarConverter
{
    /**
     * Chuyển đổi Dương lịch sang Âm lịch
     * Trả về mảng: ['day' => int, 'month' => int, 'year' => int, 'is_leap' => bool]
     */
    public static function solarToLunar(string|Carbon $solarDate): array
    {
        $dateStr = $solarDate instanceof Carbon ? $solarDate->format('Y-m-d') : $solarDate;
        
        try {
            $lunar = LunarDateTime::fromGregorian($dateStr . ' +0700');
            return [
                'day'     => (int) $lunar->day,
                'month'   => (int) $lunar->month,
                'year'    => (int) $lunar->year,
                'is_leap' => (bool) $lunar->isLeapMonth,
            ];
        } catch (\Exception $e) {
            // Fallback trong trường hợp lỗi định dạng
            $carbon = Carbon::parse($solarDate);
            return [
                'day'     => (int) $carbon->day,
                'month'   => (int) $carbon->month,
                'year'    => (int) $carbon->year,
                'is_leap' => false,
            ];
        }
    }

    /**
     * Chuyển đổi Âm lịch sang Dương lịch
     * Trả về chuỗi định dạng: YYYY-MM-DD
     */
    public static function lunarToSolar(int $day, int $month, int $year, bool $isLeap = false): string
    {
        try {
            $leapSuffix = $isLeap ? ' (+)' : '';
            $lunarStr = sprintf('%04d-%02d-%02d 00:00 +0700%s', $year, $month, $day, $leapSuffix);
            $lunar = new LunarDateTime($lunarStr);
            $solarStr = $lunar->toDateTimeString(); // Định dạng 'Y-m-d H:i:s P'
            return Carbon::parse($solarStr)->format('Y-m-d');
        } catch (\Exception $e) {
            return sprintf('%04d-%02d-%02d', $year, $month, $day);
        }
    }

    /**
     * Định dạng ngày âm lịch tiếng Việt đẹp mắt
     */
    public static function formatLunarDate(int $day, int $month, int $year, bool $isLeap = false): string
    {
        $leapStr = $isLeap ? ' (nhuận)' : '';
        return sprintf('Ngày %d tháng %d%s năm %d', $day, $month, $leapStr, $year);
    }
}
