<?php

namespace App\Services;

use App\Jobs\SendWhatsAppNotification;
use App\Models\Notification;
use App\Models\NotificationChannel;
use App\Models\NotificationLog;
use App\Models\NotificationPreference;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use App\Notifications\Channels\DiscordChannel;
use App\Notifications\Channels\InAppChannel;
use App\Notifications\Channels\MailChannel;
use App\Notifications\Channels\SlackChannel;
use App\Notifications\Channels\TelegramChannel;
use App\Notifications\Channels\WebhookChannel;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class NotificationService
{
    private array $channels = [];

    public function __construct()
    {
        $this->channels = [
            'in_app' => app(InAppChannel::class),
            'email' => app(MailChannel::class),
            'slack' => app(SlackChannel::class),
            'discord' => app(DiscordChannel::class),
            'telegram' => app(TelegramChannel::class),
            'webhook' => app(WebhookChannel::class),
        ];
    }

    public function notifyAssigned(Task $task, User $assignee, User $assignedBy): void
    {
        if ((int) $assignee->id === (int) $assignedBy->id) {
            return;
        }

        $data = [
            'type' => 'task.assigned',
            'title' => 'Task assigned',
            'body' => sprintf('%s assigned you to %s.', $assignedBy->name, $task->code),
            'task_code' => $task->code,
            'project_slug' => $task->project->slug,
            'task_id' => $task->id,
        ];

        $notification = null;

        if (NotificationPreference::isInAppEnabled($assignee, 'task.assigned')) {
            $notification = $this->create($assignee, 'task.assigned', 'Task assigned', sprintf(
                '%s assigned you to %s.',
                $assignedBy->name,
                $task->code,
            ), $task);

            $data['notification_id'] = $notification?->id;
        }

        $this->sendThroughChannels($assignee, 'task.assigned', $data);

        $this->sendWhatsApp($assignee, 'task.assigned', sprintf(
            "📋 Task: %s\n📌 %s\n⚡ Priority: %s\n👤 Assigned by: %s",
            $task->code,
            $task->title,
            $task->priority?->name ?? '-',
            $assignedBy->name,
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
        $projectSlug = $task->project->slug;

        foreach ($watchers as $watcher) {
            $watcherId = (int) $watcher->id;

            if ($watcherId === $actorId || $watcherId === $reporterId || in_array($watcherId, $assigneeIds, true)) {
                continue;
            }

            $data = [
                'type' => 'task.updated',
                'title' => 'Task updated',
                'body' => sprintf('%s updated %s.', $actor->name, $task->code),
                'task_code' => $task->code,
                'project_slug' => $projectSlug,
                'task_id' => $task->id,
            ];

            if (NotificationPreference::isInAppEnabled($watcher, 'task.updated')) {
                $notification = $this->create($watcher, 'task.updated', 'Task updated', sprintf(
                    '%s updated %s.',
                    $actor->name,
                    $task->code,
                ), $task);

                $data['notification_id'] = $notification?->id;
            }

            $this->sendThroughChannels($watcher, 'task.updated', $data);

            $this->sendWhatsApp($watcher, 'task.updated', sprintf(
                "📋 Task updated: %s\n📌 %s\n👤 By: %s",
                $task->code,
                $task->title,
                $actor->name,
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

        $projectSlug = $task->project->slug;

        foreach ($recipients as $recipient) {
            $data = [
                'type' => 'task.commented',
                'title' => 'New comment',
                'body' => sprintf('%s commented on %s.', $commenter->name, $task->code),
                'task_code' => $task->code,
                'project_slug' => $projectSlug,
                'task_id' => $task->id,
            ];

            if (NotificationPreference::isInAppEnabled($recipient, 'task.commented')) {
                $notification = $this->create($recipient, 'task.commented', 'New comment', sprintf(
                    '%s commented on %s.',
                    $commenter->name,
                    $task->code,
                ), $task, ['comment_id' => $comment->id]);

                $data['notification_id'] = $notification?->id;
            }

            $this->sendThroughChannels($recipient, 'task.commented', $data);

            $this->sendWhatsApp($recipient, 'task.commented', sprintf(
                "💬 New comment on %s\n📌 %s\n👤 By: %s",
                $task->code,
                $task->title,
                $commenter->name,
            ), $task);
        }
    }

    /**
     * @param  array<string, mixed>  $extraData
     */
    private function create(User $user, string $type, string $title, string $body, Task $task, array $extraData = []): ?Notification
    {
        $project = $task->project;

        return Notification::create([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data' => array_merge([
                'workspace_id' => $project->workspace_id,
                'project_id' => $task->project_id,
                'project_slug' => $project->slug,
                'task_id' => $task->id,
                'task_code' => $task->code,
            ], $extraData),
        ]);
    }

    /**
     * @param  array{type: string, title: string, body: string, task_code?: string, project_slug?: string, task_id?: int|null, notification_id?: string|null}  $data
     */
    private function sendThroughChannels(User $user, string $type, array $data): void
    {
        $workspaceId = $data['project_slug']
            ? optional(Project::where('slug', $data['project_slug'])->first())->workspace_id
            : null;

        $workspaceChannels = NotificationChannel::enabled()
            ->when($workspaceId, fn ($q) => $q->where('workspace_id', $workspaceId))
            ->get();

        $builtInDrivers = ['in_app', 'email'];

        // Built-in channels — always available
        foreach ($builtInDrivers as $driver) {
            if (! NotificationPreference::isEnabled($user, $type, $driver)) {
                continue;
            }
            if (! isset($this->channels[$driver])) {
                continue;
            }

            try {
                $dummyChannel = new NotificationChannel(['config' => [], 'driver' => $driver]);
                $this->channels[$driver]->send($user, $data, $dummyChannel);
                NotificationLog::create([
                    'notification_id' => $data['notification_id'] ?? null,
                    'channel' => $driver,
                    'recipient' => $driver === 'in_app' ? (string) $user->id : $user->email,
                    'type' => $type,
                    'status' => 'sent',
                    'sent_at' => now(),
                ]);
            } catch (\Throwable $e) {
                NotificationLog::create([
                    'notification_id' => $data['notification_id'] ?? null,
                    'channel' => $driver,
                    'recipient' => $driver === 'in_app' ? (string) $user->id : $user->email,
                    'type' => $type,
                    'status' => 'failed',
                    'error' => $e->getMessage(),
                    'sent_at' => now(),
                ]);
            }
        }

        // Workspace-configured channels (Slack, Discord, Telegram, Webhook)
        foreach ($workspaceChannels as $channelConfig) {
            $driver = $channelConfig->driver;

            if (in_array($driver, $builtInDrivers, true)) {
                continue;
            }

            if (! NotificationPreference::isEnabled($user, $type, $driver)) {
                continue;
            }

            if (isset($this->channels[$driver])) {
                try {
                    $this->channels[$driver]->send($user, $data, $channelConfig);
                    NotificationLog::create([
                        'notification_id' => $data['notification_id'] ?? null,
                        'channel' => $driver,
                        'recipient' => $channelConfig->name ?? $driver,
                        'type' => $type,
                        'status' => 'sent',
                        'sent_at' => now(),
                    ]);
                } catch (\Throwable $e) {
                    NotificationLog::create([
                        'notification_id' => $data['notification_id'] ?? null,
                        'channel' => $driver,
                        'recipient' => $channelConfig->name ?? $driver,
                        'type' => $type,
                        'status' => 'failed',
                        'error' => $e->getMessage(),
                        'sent_at' => now(),
                    ]);
                }
            }
        }
    }

    private function sendWhatsApp(User $user, string $type, string $message, Task $task): void
    {
        if (! NotificationPreference::isWhatsAppEnabled($user, $type)) {
            return;
        }

        $url = route('projects.tasks.show', [
            'workspace' => $task->project->workspace->slug,
            'project' => $task->project->slug,
            'task' => $task->id,
        ]);

        SendWhatsAppNotification::dispatch(
            $user->phone,
            "{$message}\n\n🔗 {$url}",
        );
    }
}
