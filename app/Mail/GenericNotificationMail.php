<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class GenericNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly array $data,
        public readonly ?string $taskUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[Taska] {$this->data['title']}",
        );
    }

    public function content(): Content
    {
        $button = $this->taskUrl
            ? sprintf(
                '<a href="%s" style="display:inline-block;padding:10px 20px;color:#fff;background:#2563eb;border-radius:6px;text-decoration:none;font-weight:600;">View Task</a>',
                $this->taskUrl,
            )
            : '';

        $html = sprintf(
            '<div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
                <h2 style="color:#1e293b;margin-top:0;">%s</h2>
                <p style="color:#475569;line-height:1.6;">%s</p>
                %s
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
                <p style="color:#94a3b8;font-size:12px;">Sent by Taska</p>
            </div>',
            htmlspecialchars($this->data['title']),
            htmlspecialchars($this->data['body']),
            $button,
        );

        return new Content(
            htmlString: $html,
        );
    }
}
