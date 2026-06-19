<?php

namespace App\Services;

use App\Events\TaskUpdated;
use App\Models\AutomationRule;
use App\Models\BoardColumn;
use App\Models\Label;
use App\Models\Notification;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class AutomationEngine
{
    public function handleTaskEvent(Task $task, string $event, array $changes = []): void
    {
        $rules = AutomationRule::where('project_id', $task->project_id)
            ->where('trigger_event', $event)
            ->where('enabled', true)
            ->orderBy('priority', 'desc')
            ->get();

        foreach ($rules as $rule) {
            if ($this->conditionsMatch($task, $rule->conditions ?? [], $changes)) {
                $this->executeActions($task, $rule->actions ?? []);
            }
        }
    }

    public function conditionsMatch(Task $task, array $conditions, array $changes): bool
    {
        if (empty($conditions)) {
            return true;
        }

        foreach ($conditions as $condition) {
            $field = $condition['field'] ?? '';
            $operator = $condition['operator'] ?? 'equals';
            $value = $condition['value'] ?? null;

            $currentValue = match ($field) {
                'status' => $task->status,
                'priority' => $task->priority?->key ?? null,
                'assignee' => $task->assignees->pluck('id')->implode(','),
                'label' => $task->labels->pluck('id')->implode(','),
                'story_points' => $task->story_points,
                default => $task->{$field} ?? null,
            };

            $match = match ($operator) {
                'equals' => $currentValue == $value,
                'not_equals' => $currentValue != $value,
                'contains' => str_contains((string) $currentValue, (string) $value),
                'not_contains' => ! str_contains((string) $currentValue, (string) $value),
                'greater_than' => $currentValue > $value,
                'less_than' => $currentValue < $value,
                'in' => in_array($currentValue, is_array($value) ? $value : explode(',', $value)),
                'not_in' => ! in_array($currentValue, is_array($value) ? $value : explode(',', $value)),
                default => false,
            };

            if (! $match) {
                return false;
            }
        }

        return true;
    }

    protected function executeActions(Task $task, array $actions): void
    {
        foreach ($actions as $action) {
            $type = $action['type'] ?? '';
            $value = $action['value'] ?? null;

            match ($type) {
                'assign' => $this->assignUser($task, $value),
                'add_label' => $this->addLabel($task, $value),
                'remove_label' => $this->removeLabel($task, $value),
                'set_priority' => $this->setPriority($task, $value),
                'move_to_column' => $this->moveToColumn($task, $value),
                'send_notification' => $this->sendNotification($task, $value),
                'add_comment' => $this->addComment($task, $value),
                default => Log::warning("Unknown automation action type: {$type}"),
            };
        }
    }

    protected function assignUser(Task $task, ?string $value): void
    {
        if ($value === null) {
            return;
        }

        $userId = (int) str_replace('user:', '', $value);
        $user = User::find($userId);

        if ($user && ! $task->assignees->contains($user->id)) {
            $task->assignees()->attach($user->id);
        }
    }

    protected function addLabel(Task $task, ?string $value): void
    {
        if ($value === null) {
            return;
        }

        $labelId = (int) str_replace('label:', '', $value);
        $label = Label::find($labelId);

        if ($label && ! $task->labels->contains($label->id)) {
            $task->labels()->attach($label->id);
        }
    }

    protected function removeLabel(Task $task, ?string $value): void
    {
        if ($value === null) {
            return;
        }

        $labelId = (int) str_replace('label:', '', $value);
        $task->labels()->detach($labelId);
    }

    protected function setPriority(Task $task, ?string $value): void
    {
        if ($value === null) {
            return;
        }

        $priorityId = (int) str_replace('priority:', '', $value);
        $task->update(['priority_id' => $priorityId]);
    }

    protected function moveToColumn(Task $task, ?string $value): void
    {
        if ($value === null) {
            return;
        }

        $columnId = (int) str_replace('column:', '', $value);
        $column = BoardColumn::find($columnId);

        if ($column) {
            $task->update([
                'board_column_id' => $column->id,
                'status' => $column->status_key,
            ]);
        }
    }

    protected function sendNotification(Task $task, ?string $value): void
    {
        if ($value === null) {
            return;
        }

        $recipients = $task->assignees->isEmpty() ? [$task->reporter] : $task->assignees->all();

        $task->loadMissing('project');

        foreach ($recipients as $recipient) {
            if ($recipient) {
                $notification = Notification::create([
                    'user_id' => $recipient->id,
                    'type' => 'automation',
                    'title' => 'Automation Rule Triggered',
                    'body' => $value,
                    'data' => ['task_id' => $task->id, 'task_code' => $task->code],
                ]);

                TaskUpdated::dispatch(
                    $recipient->id,
                    'automation',
                    'Automation Rule Triggered',
                    $value,
                    $task->code,
                    $task->project->slug,
                    (string) $notification->id,
                    $task->id,
                );
            }
        }
    }

    protected function addComment(Task $task, ?string $value): void
    {
        if ($value === null) {
            return;
        }

        $botUser = User::firstOrCreate(
            ['email' => 'automation-bot@qeerja.test'],
            ['name' => 'Automation Bot', 'password' => bcrypt(\Str::random(32))]
        );

        $task->comments()->create([
            'user_id' => $botUser->id,
            'body' => $value,
        ]);
    }
}
