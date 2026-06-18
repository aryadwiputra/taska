<?php

namespace App\Listeners;

use App\Events\TaskCreated;
use App\Events\TaskFieldUpdated;
use App\Models\Task;
use App\Models\User;
use App\Services\NotificationRuleEngine;
use Illuminate\Support\Collection;

class DispatchNotificationRules
{
    public function __construct(
        protected NotificationRuleEngine $engine,
    ) {}

    public function handleTaskFieldUpdated(TaskFieldUpdated $event): void
    {
        $task = Task::with('project', 'labels', 'assignees', 'epics', 'reporter', 'watchers')
            ->find($event->taskId);

        if (! $task) {
            return;
        }

        $triggerMap = [
            'board_column_id' => 'task.status_changed',
            'priority_id' => 'task.priority_changed',
        ];

        $users = $this->getRelevantUsers($task);

        foreach ($event->changes as $field => $newValue) {
            $trigger = $triggerMap[$field] ?? null;

            if ($trigger) {
                foreach ($users as $user) {
                    $this->engine->evaluate($user, $trigger, $task, [
                        'field' => $field,
                        'value' => $newValue,
                    ]);
                }
            }
        }
    }

    public function handleTaskCreated(TaskCreated $event): void
    {
        $task = Task::with('project', 'labels', 'assignees', 'epics', 'reporter', 'watchers')
            ->find($event->taskId);

        if (! $task) {
            return;
        }

        $users = $this->getRelevantUsers($task);

        foreach ($users as $user) {
            $this->engine->evaluate($user, 'task.created', $task);
        }
    }

    protected function getRelevantUsers(Task $task): Collection
    {
        $userIds = collect();

        if ($task->reporter_id) {
            $userIds->push($task->reporter_id);
        }

        $userIds = $userIds->merge($task->assignees->pluck('id'));
        $userIds = $userIds->merge($task->watchers->pluck('id'));

        return User::whereIn('id', $userIds->unique())->get();
    }
}
