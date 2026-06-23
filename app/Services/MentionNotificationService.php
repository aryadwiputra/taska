<?php

namespace App\Services;

use App\Jobs\SendWhatsAppNotification;
use App\Models\Notification;
use App\Models\NotificationPreference;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use App\Notifications\TaskMentionedNotification;
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

            if (NotificationPreference::isInAppEnabled($user, 'task.mentioned')) {
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

                app(RealtimeGatewayService::class)->broadcast("user.{$user->id}", 'notification', [
                    'type' => 'task.mentioned',
                    'title' => 'You were mentioned',
                    'body' => sprintf('%s mentioned you in %s.', $commenter->name, $task->code),
                    'task_code' => $task->code,
                    'project_slug' => $task->project->slug,
                    'notification_id' => $notification->id,
                    'task_id' => $task->id,
                ]);
            }

            if (NotificationPreference::isEmailEnabled($user, 'task.mentioned')) {
                $user->notify(new TaskMentionedNotification($task, $comment, $commenter));
            }

            if (NotificationPreference::isWhatsAppEnabled($user, 'task.mentioned')) {
                $truncated = mb_strlen($comment->body) > 100
                    ? mb_substr($comment->body, 0, 100).'...'
                    : $comment->body;

                $url = route('projects.tasks.show', [
                    'workspace' => $task->project->workspace->slug,
                    'project' => $task->project->slug,
                    'task' => $task->id,
                ]);

                SendWhatsAppNotification::dispatch(
                    $user->phone,
                    "💬 @{$commenter->name} mentioned you in {$task->code}\n📌 {$task->title}\n✏️ \"{$truncated}\"\n\n🔗 {$url}",
                );
            }
        }
    }
}
