<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Queue\ShouldQueue;

class ClanApprovedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $clanName;
    public string $creatorName;
    public string $loginUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(string $clanName, string $creatorName, string $loginUrl)
    {
        $this->clanName    = $clanName;
        $this->creatorName = $creatorName;
        $this->loginUrl    = $loginUrl;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Dòng họ ' . $this->clanName . ' đã được phê duyệt thành công!',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.clan_approved',
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
