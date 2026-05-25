<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AnniversaryReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user_name;
    public $deceased_name;
    public $deceased_generation;
    public $relationship;
    public $lunar_date_str;
    public $solar_date_str;
    public $dong_ho_name;
    public $app_url;

    /**
     * Create a new message instance.
     */
    public function __construct(
        string $userName,
        string $deceasedName,
        int $deceasedGeneration,
        string $relationship,
        string $lunarDateStr,
        string $solarDateStr,
        string $dongHoName
    ) {
        $this->user_name           = $userName;
        $this->deceased_name       = $deceasedName;
        $this->deceased_generation = $deceasedGeneration;
        $this->relationship        = $relationship;
        $this->lunar_date_str      = $lunarDateStr;
        $this->solar_date_str      = $solarDateStr;
        $this->dong_ho_name        = $dongHoName;
        $this->app_url             = config('app.url', 'http://localhost:8000');
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '[' . $this->dong_ho_name . '] Nhắc nhở ngày Giỗ sắp tới (Còn 3 ngày)',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.anniversary_reminder',
        );
    }
}
