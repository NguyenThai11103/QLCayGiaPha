<?php

namespace App\Events;

use App\Models\NhanVien;
use App\Models\Task;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskCompleted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Task     $task,
        public readonly NhanVien $completedBy,
    ) {}
}
