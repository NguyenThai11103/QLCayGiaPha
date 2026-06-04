<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Queue\ShouldQueue;

class ClanRequestMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $clanName;
    public string $clanAddress;
    public string $creatorName;
    public string $creatorEmail;

    /**
     * Create a new message instance.
     */
    public function __construct(string $clanName, string $clanAddress, string $creatorName, string $creatorEmail)
    {
        $this->clanName     = $clanName;
        $this->clanAddress  = $clanAddress;
        $this->creatorName  = $creatorName;
        $this->creatorEmail = $creatorEmail;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Yêu cầu tạo dòng họ mới cần duyệt: ' . $this->clanName,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.clan_request',
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}
