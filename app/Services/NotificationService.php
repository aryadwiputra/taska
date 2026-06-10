<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class NotificationService
{
    public function notifyAssigned(Task $task, User $assignee, User $assignedBy): void
    {
        if ((int) $assignee->id === (int) $assignedBy->id) {
            return;
        }

        $this->create($assignee, 'task.assigned', 'Task assigned', sprintf(
            '%s assigned you to %s.',
            $assignedBy->name,
            $task->code,
        ), $task);
    }

    /**
     * @param  User[]|Collection<int, User>  $watchers
     */
    public function notifyWatchers(Task $task, User $actor, iterable $watchers): void
    {
        $watcherIds = [];
        foreach ($watchers as $watcher) {
            $watcherIds[(int) $watcher->id] = true;
        }

        $assigneeIds = $task->assignees()->pluck('users.id')->map(fn ($id) => (int) $id)->all();
        $reporterId = $task->reporter?->id ? (int) $task->reporter->id : null;
        $actorId = (int) $actor->id;

        foreach ($watchers as $watcher) {
            $watcherId = (int) $watcher->id;

            if ($watcherId === $actorId || $watcherId === $reporterId || in_array($watcherId, $assigneeIds, true)) {
                continue;
            }

            $this->create($watcher, 'task.updated', 'Task updated', sprintf(
                '%s updated %s.',
                $actor->name,
                $task->code,
            ), $task);
        }
    }

    public function notifyComment(Task $task, User $commenter, TaskComment $comment): void
    {
        $recipients = $task->assignees()
            ->whereKeyNot($commenter->id)
            ->get()
            ->push($task->reporter)
            ->filter(fn (?User $user): bool => $user !== null && (int) $user->id !== (int) $commenter->id)
            ->unique('id');

        foreach ($recipients as $recipient) {
            $this->create($recipient, 'task.commented', 'New comment', sprintf(
                '%s commented on %s.',
                $commenter->name,
                $task->code,
            ), $task, ['comment_id' => $comment->id]);
        }
    }

    /**
     * @param  array<string, mixed>  $extraData
     */
    private function create(User $user, string $type, string $title, string $body, Task $task, array $extraData = []): void
    {
        Notification::create([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data' => array_merge([
                'workspace_id' => $task->project->workspace_id,
                'project_id' => $task->project_id,
                'project_slug' => $task->project->slug,
                'task_id' => $task->id,
                'task_code' => $task->code,
            ], $extraData),
        ]);
    }
}
