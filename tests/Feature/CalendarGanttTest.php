<?php

use App\Models\User;

use function Pest\Laravel\actingAs;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->workspace = createWorkspaceMember($this->user, 'manager');
    $this->project = createProjectForWorkspace($this->workspace, $this->user, 'manager');
});

test('tasks can be created with start and due dates', function () {
    $taskType = $this->workspace->taskTypes()->first();

    actingAs($this->user)
        ->withSession(['current_workspace_id' => $this->workspace->id])
        ->post(route('projects.tasks.store', [$this->workspace, $this->project]), [
            'title' => 'Date scheduled task',
            'task_type_id' => $taskType->id,
            'start_date' => '2026-06-01',
            'due_date' => '2026-06-15',
        ])
        ->assertRedirect();

    $task = $this->project->tasks()->where('title', 'Date scheduled task')->first();

    expect($task)->not->toBeNull();
    expect($task->start_date->format('Y-m-d'))->toBe('2026-06-01');
    expect($task->due_date->format('Y-m-d'))->toBe('2026-06-15');
});

test('due date must be after or equal to start date', function () {
    $taskType = $this->workspace->taskTypes()->first();

    actingAs($this->user)
        ->withSession(['current_workspace_id' => $this->workspace->id])
        ->post(route('projects.tasks.store', [$this->workspace, $this->project]), [
            'title' => 'Invalid dates',
            'task_type_id' => $taskType->id,
            'start_date' => '2026-06-15',
            'due_date' => '2026-06-01',
        ])
        ->assertSessionHasErrors('due_date');
});

test('project show page returns counts', function () {
    $task = createTaskForProject($this->project, $this->user);
    $task->update([
        'start_date' => '2026-06-01',
        'due_date' => '2026-06-15',
    ]);

    actingAs($this->user)
        ->withSession(['current_workspace_id' => $this->workspace->id])
        ->get(route('projects.show', [$this->workspace, $this->project]))
        ->assertInertia(fn ($page) => $page
            ->component('projects/show')
            ->has('counts.tasks')
        );
});

test('list page returns tasks with dates', function () {
    $task = createTaskForProject($this->project, $this->user);
    $task->update([
        'start_date' => '2026-06-01',
        'due_date' => '2026-06-15',
    ]);

    actingAs($this->user)
        ->withSession(['current_workspace_id' => $this->workspace->id])
        ->get(route('projects.list.index', [$this->workspace, $this->project]))
        ->assertInertia(fn ($page) => $page
            ->component('projects/list/index')
            ->has('tasks', fn ($tasks) => $tasks
                ->first(fn ($first) => $first
                    ->where('id', $task->id)
                    ->where('start_date', '2026-06-01T00:00:00.000000Z')
                    ->where('due_date', '2026-06-15T00:00:00.000000Z')
                    ->etc()
                )
            )
        );
});

test('timeline page returns tasks with dates', function () {
    $task = createTaskForProject($this->project, $this->user);
    $task->update(['start_date' => '2026-06-01', 'due_date' => '2026-06-15']);

    actingAs($this->user)
        ->withSession(['current_workspace_id' => $this->workspace->id])
        ->get(route('projects.timeline.index', [$this->workspace, $this->project]))
        ->assertInertia(fn ($page) => $page
            ->component('projects/timeline/index')
            ->where('project.slug', $this->project->slug)
        );
});

test('task dates can be updated', function () {
    $task = createTaskForProject($this->project, $this->user);

    actingAs($this->user)
        ->withSession(['current_workspace_id' => $this->workspace->id])
        ->patch(route('projects.tasks.update', [$this->workspace, $this->project, $task]), [
            'start_date' => '2026-07-01',
            'due_date' => '2026-07-31',
        ])
        ->assertRedirect();

    $task->refresh();

    expect($task->start_date->format('Y-m-d'))->toBe('2026-07-01');
    expect($task->due_date->format('Y-m-d'))->toBe('2026-07-31');
});

test('tasks without dates are still creatable', function () {
    $taskType = $this->workspace->taskTypes()->first();

    actingAs($this->user)
        ->withSession(['current_workspace_id' => $this->workspace->id])
        ->post(route('projects.tasks.store', [$this->workspace, $this->project]), [
            'title' => 'No dates task',
            'task_type_id' => $taskType->id,
        ])
        ->assertRedirect();

    $task = $this->project->tasks()->where('title', 'No dates task')->first();

    expect($task->start_date)->toBeNull();
    expect($task->due_date)->toBeNull();
});
