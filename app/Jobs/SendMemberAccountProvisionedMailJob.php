<?php

namespace App\Jobs;

use App\Mail\MemberAccountProvisionedMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendMemberAccountProvisionedMailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public readonly string $toEmail,
        public readonly string $hoTen,
        public readonly string $temporaryPassword,
        public readonly string $loginUrl,
        public readonly ?string $dongHoName = null,
    ) {}

    public function handle(): void
    {
        Mail::to($this->toEmail)->send(new MemberAccountProvisionedMail(
            hoTen: $this->hoTen,
            email: $this->toEmail,
            temporaryPassword: $this->temporaryPassword,
            loginUrl: $this->loginUrl,
            dongHoName: $this->dongHoName,
        ));
    }
}
