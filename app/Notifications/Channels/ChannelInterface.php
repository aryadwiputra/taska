<?php

namespace App\Notifications\Channels;

use App\Models\NotificationChannel;
use App\Models\User;

interface ChannelInterface
{
    /**
     * Send a notification through this channel.
     *
     * @param  array{type: string, title: string, body: string, task_code?: string, project_slug?: string, task_id?: int|null, notification_id?: string|null}  $data
     */
    public function send(User $user, array $data, NotificationChannel $channelConfig): void;
}
