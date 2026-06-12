<?php

namespace App\Services;

use App\Events\TaskUpdated;
use App\Models\Notification;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class MentionNotificationService
{
    /**
     * @param  Collection<int, User>  $mentionedUsers
     */
    public function notify(TaskComment $comment, Task $task, User $commenter, Collection $mentionedUsers): void
    {
        foreach ($mentionedUsers as $user) {
            if ((int) $user->id === (int) $commenter->id) {
                continue;
            }

            $notification = Notification::create([
                'id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'type' => 'task.mentioned',
                'title' => 'You were mentioned',
                'body' => sprintf('%s mentioned you in %s.', $commenter->name, $task->code),
                'data' => [
                    'workspace_id' => $task->project->workspace_id,
                    'project_id' => $task->project_id,
                    'project_slug' => $task->project->slug,
                    'task_id' => $task->id,
                    'task_code' => $task->code,
                    'comment_id' => $comment->id,
                ],
            ]);

            TaskUpdated::dispatch(
                $user->id,
                'task.mentioned',
                'You were mentioned',
                sprintf('%s mentioned you in %s.', $commenter->name, $task->code),
                $task->code,
                $task->project->slug,
                $notification->id,
                $task->id,
            );
        }
    }
}
