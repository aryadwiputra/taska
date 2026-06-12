<?php

namespace App\Events;

use App\Models\Task;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskMoved implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Task $task,
        public int $fromColumnId,
        public int $toColumnId,
        public int $position,
        public string $status,
        public int $projectId,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("project.{$this->projectId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'task.moved';
    }

    public function broadcastWith(): array
    {
        $this->task->loadMissing(['assignees', 'priority', 'taskType', 'epics', 'sprints', 'labels']);

        return [
            'task_id' => $this->task->id,
            'from_column_id' => $this->fromColumnId,
            'to_column_id' => $this->toColumnId,
            'position' => $this->position,
            'status' => $this->status,
            'task' => [
                'id' => $this->task->id,
                'task_number' => $this->task->task_number,
                'code' => $this->task->code,
                'title' => $this->task->title,
                'status' => $this->task->status,
                'position' => $this->task->position,
                'due_date' => $this->task->due_date?->toDateString(),
                'priority' => $this->task->relationLoaded('priority') && $this->task->priority
                    ? ['id' => $this->task->priority->id, 'name' => $this->task->priority->name, 'key' => $this->task->priority->key, 'color' => $this->task->priority->color]
                    : null,
                'task_type' => $this->task->relationLoaded('taskType') && $this->task->taskType
                    ? ['id' => $this->task->taskType->id, 'name' => $this->task->taskType->name, 'key' => $this->task->taskType->key, 'color' => $this->task->taskType->color]
                    : ['id' => 0, 'name' => '', 'key' => '', 'color' => null],
                'assignees' => $this->task->relationLoaded('assignees')
                    ? $this->task->assignees->map(fn ($a) => ['id' => $a->id, 'name' => $a->name, 'avatar' => $a->avatar])
                    : [],
                'epics' => $this->task->relationLoaded('epics')
                    ? $this->task->epics->map(fn ($e) => ['id' => $e->id, 'name' => $e->name, 'color' => $e->color, 'status' => $e->status])
                    : [],
                'sprints' => $this->task->relationLoaded('sprints')
                    ? $this->task->sprints->map(fn ($s) => ['id' => $s->id, 'name' => $s->name, 'status' => $s->status, 'start_date' => $s->start_date?->toDateString(), 'end_date' => $s->end_date?->toDateString()])
                    : [],
            ],
        ];
    }
}
