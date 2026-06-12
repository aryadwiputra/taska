<?php

use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\User;
use App\Services\WorkspaceRoleService;
use Illuminate\Support\Facades\Event;

test('task creation logs activity and assignment notifications', function () {
    $reporter = User::factory()->create();
    $assignee = User::factory()->create();
    $workspace = createWorkspaceMember($reporter, 'manager');
    $workspace->members()->create([
        'user_id' => $assignee->id,
        'role' => 'member',
        'status' => 'active',
    ]);
    app(WorkspaceRoleService::class)->syncRole($assignee, $workspace, 'member');
    $project = createProjectForWorkspace($workspace, $reporter, 'manager');
    $project->members()->create([
        'user_id' => $assignee->id,
        'role' => 'developer',
    ]);
    $taskType = $workspace->taskTypes()->first();

    $this->actingAs($reporter)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.tasks.store', [$workspace, $project]), [
            'title' => 'Logged task',
            'task_type_id' => $taskType->id,
            'assignee_ids' => [$assignee->id],
        ])
        ->assertRedirect();

    $task = $project->tasks()->where('title', 'Logged task')->first();

    expect($task->activities()->where('action', 'created')->exists())->toBeTrue()
        ->and($task->activities()->where('action', 'assigned')->exists())->toBeTrue()
        ->and(ActivityLog::where('subject_id', $task->id)->where('action', 'created')->exists())->toBeTrue()
        ->and(Notification::where('user_id', $assignee->id)->where('type', 'task.assigned')->exists())->toBeTrue();
});

test('task updates and moves log activity', function () {
    Event::fake();

    $developer = User::factory()->create();
    $workspace = createWorkspaceMember($developer, 'manager');
    $project = createProjectForWorkspace($workspace, $developer, 'developer');
    $task = createTaskForProject($project, $developer);
    $doneColumn = $project->boards()->first()->columns()->where('status_key', 'done')->first();
    $priority = $workspace->priorities()->where('key', 'urgent')->first();

    $this->actingAs($developer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->patch(route('projects.tasks.update', [$workspace, $project, $task]), [
            'priority_id' => $priority->id,
            'due_date' => now()->addDays(3)->toDateString(),
        ])
        ->assertRedirect();

    $this->actingAs($developer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.tasks.move', [$workspace, $project, $task]), [
            'board_column_id' => $doneColumn->id,
            'position' => 1,
        ])
        ->assertRedirect();

    expect($task->activities()->where('action', 'priority_changed')->exists())->toBeTrue()
        ->and($task->activities()->where('action', 'due_date_changed')->exists())->toBeTrue()
        ->and($task->activities()->where('action', 'moved')->exists())->toBeTrue();
});
