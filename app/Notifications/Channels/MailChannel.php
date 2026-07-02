<?php

namespace App\Notifications\Channels;

use App\Models\NotificationChannel;
use App\Models\User;
use App\Services\MailjetService;

readonly class MailChannel implements ChannelInterface
{
    public function send(User $user, array $data, NotificationChannel $channelConfig): void
    {
        if (! $user->email) {
            return;
        }

        $taskUrl = $this->buildTaskUrl($data);
        $subject = '[Taska] '.$data['title'];
        $html = $this->buildHtml($data['title'], $data['body'], $taskUrl);

        app(MailjetService::class)->send(
            $user->email,
            $user->name,
            $subject,
            $html,
        );
    }

    private function buildHtml(string $title, string $body, ?string $taskUrl): string
    {
        $button = $taskUrl
            ? sprintf(
                '<a href="%s" style="display:inline-block;padding:10px 20px;color:#fff;background:#2563eb;border-radius:6px;text-decoration:none;font-weight:600;">View Task</a>',
                $taskUrl,
            )
            : '';

        return sprintf(
            '<div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
                <h2 style="color:#1e293b;margin-top:0;">%s</h2>
                <p style="color:#475569;line-height:1.6;">%s</p>
                %s
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
                <p style="color:#94a3b8;font-size:12px;">Sent by Taska</p>
            </div>',
            htmlspecialchars($title),
            htmlspecialchars($body),
            $button,
        );
    }

    private function buildTaskUrl(array $data): ?string
    {
        if (empty($data['project_slug']) || empty($data['task_id'])) {
            return null;
        }

        return url("/{$data['project_slug']}/tasks/{$data['task_id']}");
    }
}
