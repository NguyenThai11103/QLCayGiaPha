<?php

namespace App\Listeners;

use App\Events\TaskCompleted;
use App\Jobs\SendTelegramMessageJob;

class SendTelegramOnTaskCompleted
{
    public function handle(TaskCompleted $event): void
    {
        $task        = $event->task;
        $completedBy = $event->completedBy->ten_goi_nho ?: $event->completedBy->ho_va_ten;
        $projectName = $task->duAn?->ten ?? 'N/A';

        // Thông báo cho người giao task
        $nguoiGiao = $task->nguoiGiao;
        if ($nguoiGiao && $nguoiGiao->id !== $event->completedBy->id && !empty($nguoiGiao->telegram_chat_id)) {
            $text = "✅ <b>Task đã hoàn thành!</b>\n\n"
                  . "🔖 <b>{$task->tieu_de}</b>\n"
                  . "📁 Dự án: {$projectName}\n"
                  . "👤 Hoàn thành bởi: {$completedBy}";

            SendTelegramMessageJob::dispatch($nguoiGiao->telegram_chat_id, $text);
        }
    }
}
