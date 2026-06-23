<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\NotificationRule;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class NotificationRuleEngine
{
    public function evaluate(User $user, string $eventType, Task $task, array $changes = []): void
    {
        $rules = NotificationRule::where('user_id', $user->id)
            ->where('event_type', $eventType)
            ->where('enabled', true)
            ->where(fn ($q) => $q->whereNull('project_id')->orWhere('project_id', $task->project_id))
            ->get();

        foreach ($rules as $rule) {
            if ($this->conditionsMatch($rule->conditions ?? [], $task, $changes)) {
                $this->sendNotification($rule, $user, $task, $changes);
            }
        }
    }

    protected function conditionsMatch(?array $conditions, Task $task, array $changes): bool
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
                'in' => in_array($currentValue, is_array($value) ? $value : explode(',', (string) $value)),
                'not_in' => ! in_array($currentValue, is_array($value) ? $value : explode(',', (string) $value)),
                default => false,
            };

            if (! $match) {
                return false;
            }
        }

        return true;
    }

    protected function sendNotification(NotificationRule $rule, User $user, Task $task, array $changes): void
    {
        $channels = $rule->channels ?? ['in_app'];

        if (in_array('in_app', $channels)) {
            $notification = Notification::create([
                'user_id' => $user->id,
                'type' => 'rule_triggered',
                'title' => $rule->name,
                'body' => "Rule \"{$rule->name}\" triggered for task {$task->code}.",
                'data' => [
                    'task_id' => $task->id,
                    'task_code' => $task->code,
                    'rule_id' => $rule->id,
                    'rule_name' => $rule->name,
                    'changes' => $changes,
                ],
            ]);

            $task->loadMissing('project');

            app(RealtimeGatewayService::class)->broadcast("user.{$user->id}", 'notification', [
                'type' => 'rule_triggered',
                'title' => $rule->name,
                'body' => "Rule \"{$rule->name}\" triggered for task {$task->code}.",
                'task_code' => $task->code,
                'project_slug' => $task->project->slug,
                'notification_id' => (string) $notification->id,
                'task_id' => $task->id,
            ]);
        }

        if (in_array('email', $channels)) {
            Log::info("Notification rule email would be sent to {$user->email} for task {$task->code}", [
                'rule' => $rule->name,
                'changes' => $changes,
            ]);
        }
    }
}
