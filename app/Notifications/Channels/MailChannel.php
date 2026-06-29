<?php

namespace App\Notifications\Channels;

use App\Mail\GenericNotificationMail;
use App\Models\NotificationChannel;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

readonly class MailChannel implements ChannelInterface
{
    public function send(User $user, array $data, NotificationChannel $channelConfig): void
    {
        if (! $user->email) {
            return;
        }

        $taskUrl = $this->buildTaskUrl($data);

        Mail::to($user)->send(new GenericNotificationMail($data, $taskUrl));
    }

    private function buildTaskUrl(array $data): ?string
    {
        if (empty($data['project_slug']) || empty($data['task_id'])) {
            return null;
        }

        return url("/{$data['project_slug']}/tasks/{$data['task_id']}");
    }
}
