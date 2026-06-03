<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FamilyInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $memberName,
        public readonly string $familyName,
        public readonly string $inviteUrl,
        public readonly string $inviterName,
        public readonly ?string $expiresAtText = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Loi moi tham gia dong ho ' . $this->familyName,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.family_invitation',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
