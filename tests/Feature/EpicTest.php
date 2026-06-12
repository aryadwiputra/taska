<?php

use App\Models\Epic;
use App\Models\User;

test('project managers can create epics', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.epics.store', [$workspace, $project]), [
            'name' => 'Launch beta',
            'summary' => 'Scope beta launch work',
            'color' => '#2563eb',
            'status' => 'active',
            'start_date' => '2026-06-01',
            'due_date' => '2026-06-30',
        ])
        ->assertRedirect();

    expect($project->epics()->where('name', 'Launch beta')->exists())->toBeTrue();
});

test('project viewers cannot manage epics', function () {
    $viewer = User::factory()->create();
    $workspace = createWorkspaceMember($viewer, 'manager');
    $project = createProjectForWorkspace($workspace, $viewer, 'viewer');

    $this->actingAs($viewer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.epics.store', [$workspace, $project]), [
            'name' => 'Blocked epic',
        ])
        ->assertForbidden();
});

test('project managers can add and remove tasks from epics', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $task = createTaskForProject($project, $manager);
    $epic = Epic::create([
        'project_id' => $project->id,
        'name' => 'Test epic',
        'status' => 'active',
    ]);

    $this->actingAs($manager)->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.epics.add-task', [$workspace, $project, $epic]), [
            'task_id' => $task->id,
        ])
        ->assertRedirect();

    expect($epic->tasks()->where('task_id', $task->id)->exists())->toBeTrue();

    $this->actingAs($manager)->withSession(['current_workspace_id' => $workspace->id])
        ->delete(route('projects.epics.remove-task', [$workspace, $project, $epic]), [
            'task_id' => $task->id,
        ])
        ->assertRedirect();

    expect($epic->tasks()->where('task_id', $task->id)->exists())->toBeFalse();
});

test('project managers can update and delete epics attached to tasks', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $task = createTaskForProject($project, $manager);
    $epic = Epic::create([
        'project_id' => $project->id,
        'name' => 'Old epic',
        'summary' => 'Old summary',
        'color' => '#64748b',
        'status' => 'active',
    ]);
    $task->epics()->attach($epic->id);

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->put(route('projects.epics.update', [$workspace, $project, $epic]), [
            'name' => 'Updated epic',
            'summary' => 'Updated summary',
            'color' => '#8b5cf6',
            'status' => 'completed',
        ])
        ->assertRedirect();

    expect($epic->refresh()->name)->toBe('Updated epic')
        ->and($epic->status)->toBe('completed');

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->delete(route('projects.epics.destroy', [$workspace, $project, $epic]))
        ->assertRedirect();

    expect($epic->refresh()->trashed())->toBeTrue()
        ->and($task->epics()->count())->toBe(0);
});
