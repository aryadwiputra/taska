<?php

namespace App\Events;

use App\Models\Task;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

class TaskCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $projectId,
        public int $taskId,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("project.{$this->projectId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'task.created';
    }

    public function broadcastWith(): array
    {
        $task = Task::with(['assignees:id,name,avatar', 'priority', 'taskType', 'epics', 'sprints'])
            ->findOrFail($this->taskId);

        return [
            'projectId' => $this->projectId,
            'taskId' => $this->taskId,
            'column_id' => $task->board_column_id,
            'task' => [
                'id' => $task->id,
                'task_number' => $task->task_number,
                'code' => $task->code,
                'title' => $task->title,
                'status' => $task->status,
                'position' => (int) $task->position,
                'due_date' => $task->due_date?->toDateString(),
                'priority' => $task->priority
                    ? ['id' => $task->priority->id, 'name' => $task->priority->name, 'key' => $task->priority->key, 'color' => $task->priority->color]
                    : null,
                'task_type' => [
                    'id' => $task->taskType->id,
                    'name' => $task->taskType->name,
                    'key' => $task->taskType->key,
                    'color' => $task->taskType->color,
                ],
                'assignees' => $task->assignees->map(fn ($a) => [
                    'id' => $a->id,
                    'name' => $a->name,
                    'avatar' => $a->avatar,
                ])->values()->toArray(),
                'epics' => $task->epics->map(fn ($e) => [
                    'id' => $e->id,
                    'name' => $e->name,
                    'color' => $e->color,
                    'status' => $e->status,
                ])->values()->toArray(),
                'sprints' => $task->sprints->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'status' => $s->status,
                    'start_date' => $s->start_date?->toDateString(),
                    'end_date' => $s->end_date?->toDateString(),
                ])->values()->toArray(),
            ],
        ];
    }
}
