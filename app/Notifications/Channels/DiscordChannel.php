<?php

namespace App\Notifications\Channels;

use App\Models\NotificationChannel;
use App\Models\User;
use Illuminate\Support\Facades\Http;

readonly class DiscordChannel implements ChannelInterface
{
    public function send(User $user, array $data, NotificationChannel $channelConfig): void
    {
        $webhookUrl = $channelConfig->config['webhook_url'] ?? null;

        if (! $webhookUrl) {
            return;
        }

        $taskUrl = $this->buildTaskUrl($data);

        $embed = [
            'title' => $data['title'],
            'description' => $data['body'],
            'color' => 0x2563EB,
            'timestamp' => now()->toISOString(),
            'footer' => ['text' => 'Taska'],
        ];

        if ($taskUrl) {
            $embed['url'] = $taskUrl;
        }

        Http::timeout(5)->post($webhookUrl, ['embeds' => [$embed]]);
    }

    private function buildTaskUrl(array $data): ?string
    {
        if (empty($data['project_slug']) || empty($data['task_id'])) {
            return null;
        }

        return config('app.url')."/{$data['project_slug']}/tasks/{$data['task_id']}";
    }
}
