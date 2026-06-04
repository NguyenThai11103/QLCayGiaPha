<?php

namespace App\Listeners;

use App\Events\TaskCommented;
use App\Jobs\SendTelegramMessageJob;

class SendTelegramOnTaskCommented
{
    public function handle(TaskCommented $event): void
    {
        $task        = $event->task;
        $commenter   = $event->commentedBy;
        $projectName = $task->duAn?->ten ?? 'N/A';
        $commenterName = $commenter->ten_goi_nho ?: $commenter->ho_va_ten;

        // Gửi cho tất cả người được giao task (trừ người comment)
        $recipients = $task->nguoiNhans->filter(fn($nv) => $nv->id !== $commenter->id);

        // Thêm người giao task vào ds nhận thông báo (nếu không phải người comment)
        if ($task->nguoiGiao && $task->nguoiGiao->id !== $commenter->id) {
            $recipients = $recipients->push($task->nguoiGiao);
        }

        // Loại trùng, lấy chat_id
        $chatIds = $recipients
            ->unique('id')
            ->pluck('telegram_chat_id')
            ->filter()
            ->values()
            ->all();

        if (empty($chatIds)) {
            return;
        }

        $preview = mb_strlen($event->comment) > 100
            ? mb_substr($event->comment, 0, 100) . '...'
            : $event->comment;

        $text = "💬 <b>Bình luận mới trên task!</b>\n\n"
              . "🔖 <b>{$task->tieu_de}</b>\n"
              . "📁 Dự án: {$projectName}\n"
              . "👤 {$commenterName}: {$preview}";

        foreach ($chatIds as $chatId) {
            SendTelegramMessageJob::dispatch($chatId, $text);
        }
    }
}
