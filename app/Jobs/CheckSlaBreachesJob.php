<?php

namespace App\Jobs;

use App\Models\SlaPolicy;
use App\Models\Task;
use App\Models\TaskActivity;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CheckSlaBreachesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct()
    {
        $this->onQueue('low');
    }

    public function handle(): void
    {
        $policies = SlaPolicy::where('enabled', true)
            ->with('project')
            ->get();

        foreach ($policies as $policy) {
            $this->checkResponseTime($policy);
            $this->checkResolutionTime($policy);
        }
    }

    private function checkResponseTime(SlaPolicy $policy): void
    {
        $breachedTasks = Task::where('project_id', $policy->project_id)
            ->where('task_type_id', $policy->task_type_id)
            ->whereNull('first_responded_at')
            ->whereNull('archived_at')
            ->where('created_at', '<=', now()->subHours($policy->response_hours))
            ->get();

        foreach ($breachedTasks as $task) {
            $task->update(['first_responded_at' => $task->created_at]);

            TaskActivity::create([
                'task_id' => $task->id,
                'user_id' => null,
                'action' => 'sla_breach',
                'field_name' => 'response_time',
                'old_value' => null,
                'new_value' => "Breached after {$policy->response_hours}h",
            ]);
        }
    }

    private function checkResolutionTime(SlaPolicy $policy): void
    {
        $breachedTasks = Task::where('project_id', $policy->project_id)
            ->where('task_type_id', $policy->task_type_id)
            ->whereNull('completed_at')
            ->whereNull('archived_at')
            ->where('created_at', '<=', now()->subHours($policy->resolution_hours))
            ->get();

        foreach ($breachedTasks as $task) {
            TaskActivity::create([
                'task_id' => $task->id,
                'user_id' => null,
                'action' => 'sla_breach',
                'field_name' => 'resolution_time',
                'old_value' => null,
                'new_value' => "Breached after {$policy->resolution_hours}h",
            ]);
        }
    }
}
