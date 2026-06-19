<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

class TasksReordered implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    /**
     * @param  array<int, array{
     *     id: int,
     *     name: string,
     *     status_key: string,
     *     color: string|null,
     *     position: int,
     *     is_done_column: bool,
     *     wip_limit: int|null,
     *     tasks: array<int, array{
     *         id: int,
     *         task_number: int,
     *         code: string,
     *         title: string,
     *         status: string,
     *         position: float,
     *         due_date: string|null,
     *         priority: array{id: int, name: string, key: string, color: string|null}|null,
     *         task_type: array{id: int, name: string, key: string, color: string|null},
     *         assignees: array<int, array{id: int, name: string, avatar: string|null}>,
     *         epics: array<int, array{id: int, name: string, color: string|null, status: string}>,
     *         sprints: array<int, array{id: int, name: string, status: string, start_date: string|null, end_date: string|null}>
     *     }>
     * }>  $columns
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
        return 'tasks.reordered';
    }

    public function broadcastWith(): array
    {
        return [
            'columns' => $this->columns,
        ];
    }
}
