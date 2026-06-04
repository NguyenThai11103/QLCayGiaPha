<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MemberAccountProvisionedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $hoTen,
        public readonly string $email,
        public readonly string $temporaryPassword,
        public readonly string $loginUrl,
        public readonly ?string $dongHoName = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Tài khoản Gia Phả Số của bạn đã được cấp',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.member_account_provisioned',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
