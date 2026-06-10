<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\BoardColumn;
use App\Models\Epic;
use App\Models\Sprint;
use App\Models\Task;
use App\Models\TaskAttachment;
use App\Models\TaskComment;
use App\Models\User;

class TaskActivityService
{
    public function __construct(private readonly NotificationService $notifications) {}

    public function created(Task $task, User $user): void
    {
        $this->log($task, $user, 'created', description: sprintf('created %s', $task->code));
    }

    /**
     * @param  array<string, mixed>  $before
     * @param  list<int>  $oldAssigneeIds
     * @param  list<int>  $newAssigneeIds
     * @param  list<int>  $oldEpicIds
     * @param  list<int>  $newEpicIds
     * @param  list<int>  $oldSprintIds
     * @param  list<int>  $newSprintIds
     * @param  list<int>  $oldWatcherIds
     * @param  list<int>  $newWatcherIds
     */
    public function updated(Task $task, User $user, array $before, array $oldAssigneeIds, array $newAssigneeIds, array $oldEpicIds = [], array $newEpicIds = [], array $oldSprintIds = [], array $newSprintIds = [], array $oldWatcherIds = [], array $newWatcherIds = []): void
    {
        $fieldActions = [
            'title' => 'updated',
            'description' => 'updated',
            'task_type_id' => 'updated',
            'priority_id' => 'priority_changed',
            'board_column_id' => 'status_changed',
            'start_date' => 'updated',
            'due_date' => 'due_date_changed',
            'parent_id' => 'parent_changed',
        ];

        foreach ($fieldActions as $field => $action) {
            if (! array_key_exists($field, $before) || (string) ($before[$field] ?? '') === (string) ($task->{$field} ?? '')) {
                continue;
            }

            $this->log(
                task: $task,
                user: $user,
                action: $action,
                fieldName: $field,
                oldValue: $this->displayValue($field, $before[$field], $task),
                newValue: $this->displayValue($field, $task->{$field}, $task),
                description: sprintf('updated %s on %s', str_replace('_', ' ', $field), $task->code),
            );
        }

        $assignedIds = array_values(array_diff($newAssigneeIds, $oldAssigneeIds));
        $unassignedIds = array_values(array_diff($oldAssigneeIds, $newAssigneeIds));

        if ($assignedIds !== []) {
            $assignees = User::whereKey($assignedIds)->get();

            foreach ($assignees as $assignee) {
                $this->log($task, $user, 'assigned', 'assignee', newValue: $assignee->name, description: sprintf('assigned %s to %s', $assignee->name, $task->code));
                $this->notifications->notifyAssigned($task, $assignee, $user);
            }
        }

        if ($unassignedIds !== []) {
            $assignees = User::whereKey($unassignedIds)->get();

            foreach ($assignees as $assignee) {
                $this->log($task, $user, 'unassigned', 'assignee', oldValue: $assignee->name, description: sprintf('unassigned %s from %s', $assignee->name, $task->code));
            }
        }

        $this->logPivotChanges($task, $user, 'epic_changed', 'epic', Epic::class, $oldEpicIds, $newEpicIds);
        $this->logPivotChanges($task, $user, 'sprint_changed', 'sprint', Sprint::class, $oldSprintIds, $newSprintIds);

        $addedWatcherIds = array_values(array_diff($newWatcherIds, $oldWatcherIds));
        $removedWatcherIds = array_values(array_diff($oldWatcherIds, $newWatcherIds));

        if ($addedWatcherIds !== []) {
            $watchers = User::whereKey($addedWatcherIds)->get();

            foreach ($watchers as $watcher) {
                $this->log($task, $user, 'watcher_added', 'watcher', newValue: $watcher->name, description: sprintf('added watcher %s to %s', $watcher->name, $task->code));
            }
        }

        if ($removedWatcherIds !== []) {
            $watchers = User::whereKey($removedWatcherIds)->get();

            foreach ($watchers as $watcher) {
                $this->log($task, $user, 'watcher_removed', 'watcher', oldValue: $watcher->name, description: sprintf('removed watcher %s from %s', $watcher->name, $task->code));
            }
        }
    }

    public function moved(Task $task, User $user, ?BoardColumn $from, BoardColumn $to): void
    {
        if ($from && (int) $from->id === (int) $to->id) {
            return;
        }

        $this->log($task, $user, 'moved', 'status', $from?->name, $to->name, sprintf('moved %s to %s', $task->code, $to->name));
    }

    public function deleted(Task $task, User $user): void
    {
        $this->log($task, $user, 'deleted', description: sprintf('deleted %s', $task->code));
    }

    public function commented(Task $task, User $user, TaskComment $comment): void
    {
        $this->log($task, $user, 'commented', description: sprintf('commented on %s', $task->code));
        $this->notifications->notifyComment($task, $user, $comment);
    }

    public function attachmentAdded(Task $task, User $user, TaskAttachment $attachment): void
    {
        $this->log($task, $user, 'attachment_added', 'attachment', newValue: $attachment->file_name, description: sprintf('attached %s to %s', $attachment->file_name, $task->code));
    }

    private function log(Task $task, User $user, string $action, ?string $fieldName = null, ?string $oldValue = null, ?string $newValue = null, ?string $description = null): void
    {
        $task->activities()->create([
            'user_id' => $user->id,
            'action' => $action,
            'field_name' => $fieldName,
            'old_value' => $oldValue,
            'new_value' => $newValue,
        ]);

        ActivityLog::create([
            'workspace_id' => $task->project->workspace_id,
            'project_id' => $task->project_id,
            'user_id' => $user->id,
            'subject_type' => $task->getMorphClass(),
            'subject_id' => $task->id,
            'action' => $action,
            'description' => $description ?? $action,
            'properties' => [
                'task_id' => $task->id,
                'task_code' => $task->code,
                'field_name' => $fieldName,
                'old_value' => $oldValue,
                'new_value' => $newValue,
            ],
        ]);
    }

    /**
     * @param  class-string<Epic|Sprint>  $modelClass
     * @param  list<int>  $oldIds
     * @param  list<int>  $newIds
     */
    private function logPivotChanges(Task $task, User $user, string $action, string $fieldName, string $modelClass, array $oldIds, array $newIds): void
    {
        if ($oldIds === $newIds) {
            return;
        }

        $oldValue = $this->namesFor($modelClass, $oldIds);
        $newValue = $this->namesFor($modelClass, $newIds);

        if ($oldValue === $newValue) {
            return;
        }

        $this->log($task, $user, $action, $fieldName, $oldValue, $newValue, sprintf('changed %s on %s', $fieldName, $task->code));
    }

    /**
     * @param  class-string<Epic|Sprint>  $modelClass
     * @param  list<int>  $ids
     */
    private function namesFor(string $modelClass, array $ids): ?string
    {
        if ($ids === []) {
            return null;
        }

        return $modelClass::whereKey($ids)
            ->orderBy('name')
            ->pluck('name')
            ->implode(', ');
    }

    public function logRelationChange(Task $task, User $user, string $action, string $relationType, ?string $relatedCode = null): void
    {
        $description = match ($action) {
            'relation_added' => sprintf('added %s relation %s to %s', $relationType, $relatedCode, $task->code),
            'relation_removed' => sprintf('removed %s relation %s from %s', $relationType, $relatedCode, $task->code),
            default => sprintf('%s relation on %s', $action, $task->code),
        };

        $this->log($task, $user, $action, 'relation', newValue: $relatedCode, description: $description);
    }

    private function displayValue(string $field, mixed $value, Task $task): ?string
    {
        if ($value === null) {
            return null;
        }

        return match ($field) {
            'priority_id' => $task->project->workspace->priorities()->whereKey($value)->value('name'),
            'task_type_id' => $task->project->workspace->taskTypes()->whereKey($value)->value('name'),
            'board_column_id' => BoardColumn::whereKey($value)->value('name'),
            'parent_id' => Task::whereKey($value)->value('code'),
            default => (string) $value,
        };
    }
}
