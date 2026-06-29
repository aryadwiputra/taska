<?php

namespace App\Notifications\Channels;

use App\Models\NotificationChannel;
use App\Models\User;
use Illuminate\Support\Facades\Http;

readonly class TelegramChannel implements ChannelInterface
{
    public function send(User $user, array $data, NotificationChannel $channelConfig): void
    {
        $botToken = $channelConfig->config['bot_token'] ?? null;
        $chatId = $channelConfig->config['chat_id'] ?? null;

        if (! $botToken || ! $chatId) {
            return;
        }

        $taskUrl = $this->buildTaskUrl($data);

        $text = sprintf("*%s*\n%s", $data['title'], $data['body']);

        if ($data['task_code'] ?? null) {
            $text .= sprintf("\n📋 %s", $data['task_code']);
        }

        $payload = [
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => 'Markdown',
        ];

        if ($taskUrl) {
            $payload['reply_markup'] = json_encode([
                'inline_keyboard' => [[
                    ['text' => 'View Task', 'url' => $taskUrl],
                ]],
            ]);
        }

        Http::timeout(5)->post(
            "https://api.telegram.org/bot{$botToken}/sendMessage",
            $payload,
        );
    }

    private function buildTaskUrl(array $data): ?string
    {
        if (empty($data['project_slug']) || empty($data['task_id'])) {
            return null;
        }

        return config('app.url')."/{$data['project_slug']}/tasks/{$data['task_id']}";
    }
}
