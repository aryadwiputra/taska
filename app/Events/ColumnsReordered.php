<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

class ColumnsReordered implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    /**
     * @param  array<int, array{id: int, position: int}>  $columns
     */
    public function __construct(
        public int $projectId,
        public array $columns,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("project.{$this->projectId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'columns.reordered';
    }

    public function broadcastWith(): array
    {
        return [
            'columns' => $this->columns,
        ];
    }
}
