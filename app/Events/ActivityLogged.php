<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

class ActivityLogged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $projectId,
        public int $taskId,
        public string $taskCode,
        public string $action,
        public ?string $fieldName,
        public ?string $oldValue,
        public ?string $newValue,
        public int $userId,
        public string $userName,
        public string $createdAt,
        public int $activityId,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("project.{$this->projectId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'activity.logged';
    }
}
