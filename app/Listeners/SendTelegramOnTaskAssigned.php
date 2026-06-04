<?php

namespace App\Listeners;

use App\Events\TaskAssigned;
use App\Jobs\SendTelegramMessageJob;

class SendTelegramOnTaskAssigned
{
    public function handle(TaskAssigned $event): void
    {
        $chatId = $event->assignedTo->telegram_chat_id;
        if (empty($chatId)) {
            return;
        }

        $task      = $event->task;
        $assigner  = $event->assignedBy->ten_goi_nho ?: $event->assignedBy->ho_va_ten;
        $projectName = $task->duAn?->ten ?? 'N/A';
        $deadline  = $task->deadline ? $task->deadline->format('d/m/Y H:i') : 'Không có';
        $priority  = ['Thấp', 'Trung bình', 'Cao', 'Khẩn cấp'][$task->do_uu_tien ?? 0];

        $text = "📋 <b>Bạn có task mới!</b>\n\n"
              . "🔖 <b>{$task->tieu_de}</b>\n"
              . "📁 Dự án: {$projectName}\n"
              . "⚡ Ưu tiên: {$priority}\n"
              . "📅 Deadline: {$deadline}\n"
              . "👤 Giao bởi: {$assigner}";

        SendTelegramMessageJob::dispatch($chatId, $text);
    }
}
