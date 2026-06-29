<?php

namespace App\Notifications\Channels;

use App\Models\NotificationChannel;
use App\Models\User;
use Illuminate\Support\Facades\Http;

readonly class WebhookChannel implements ChannelInterface
{
    public function send(User $user, array $data, NotificationChannel $channelConfig): void
    {
        $url = $channelConfig->config['url'] ?? null;
        $secret = $channelConfig->config['secret'] ?? null;
        $headers = $channelConfig->config['headers'] ?? [];

        if (! $url) {
            return;
        }

        $payload = [
            'type' => $data['type'],
            'title' => $data['title'],
            'body' => $data['body'],
            'user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email],
            'data' => $data,
            'timestamp' => now()->toISOString(),
        ];

        if ($secret) {
            $payload['signature'] = hash_hmac('sha256', json_encode($payload), $secret);
        }

        Http::timeout(5)
            ->withHeaders((array) $headers)
            ->post($url, $payload);
    }
}
