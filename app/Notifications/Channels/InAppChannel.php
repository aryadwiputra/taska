<?php

namespace App\Notifications\Channels;

use App\Models\NotificationChannel;
use App\Models\User;
use App\Services\RealtimeGatewayService;

readonly class InAppChannel implements ChannelInterface
{
    public function send(User $user, array $data, NotificationChannel $channelConfig): void
    {
        app(RealtimeGatewayService::class)->broadcast("user.{$user->id}", 'notification', [
            'type' => $data['type'],
            'title' => $data['title'],
            'body' => $data['body'],
            'task_code' => $data['task_code'] ?? null,
            'project_slug' => $data['project_slug'] ?? null,
            'notification_id' => $data['notification_id'] ?? null,
            'task_id' => $data['task_id'] ?? null,
        ]);
    }
}
