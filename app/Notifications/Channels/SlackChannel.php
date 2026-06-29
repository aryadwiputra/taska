<?php

namespace App\Notifications\Channels;

use App\Models\NotificationChannel;
use App\Models\User;
use Illuminate\Support\Facades\Http;

readonly class SlackChannel implements ChannelInterface
{
    public function send(User $user, array $data, NotificationChannel $channelConfig): void
    {
        $webhookUrl = $channelConfig->config['webhook_url'] ?? null;

        if (! $webhookUrl) {
            return;
        }

        $taskUrl = $this->buildTaskUrl($data);

        $blocks = [
            [
                'type' => 'section',
                'text' => [
                    'type' => 'mrkdwn',
                    'text' => sprintf("*%s*\n%s", $data['title'], $data['body']),
                ],
            ],
        ];

        if ($data['task_code'] ?? null) {
            $blocks[] = [
                'type' => 'context',
                'elements' => [
                    ['type' => 'mrkdwn', 'text' => "📋 {$data['task_code']}"],
                ],
            ];
        }

        if ($taskUrl) {
            $blocks[] = [
                'type' => 'actions',
                'elements' => [
                    [
                        'type' => 'button',
                        'text' => ['type' => 'plain_text', 'text' => 'View Task'],
                        'url' => $taskUrl,
                    ],
                ],
            ];
        }

        Http::timeout(5)->post($webhookUrl, ['blocks' => $blocks]);
    }

    private function buildTaskUrl(array $data): ?string
    {
        if (empty($data['project_slug']) || empty($data['task_id'])) {
            return null;
        }

        return config('app.url')."/{$data['project_slug']}/tasks/{$data['task_id']}";
    }
}
