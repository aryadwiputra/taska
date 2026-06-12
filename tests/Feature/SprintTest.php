<?php

use App\Models\Sprint;
use App\Models\User;

test('project managers can create sprints', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.sprints.store', [$workspace, $project]), [
            'name' => 'Sprint 1',
            'goal' => 'Ship beta flow',
            'status' => 'planned',
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-14',
        ])
        ->assertRedirect();

    expect($project->sprints()->where('name', 'Sprint 1')->exists())->toBeTrue();
});

test('project viewers cannot manage sprints', function () {
    $viewer = User::factory()->create();
    $workspace = createWorkspaceMember($viewer, 'manager');
    $project = createProjectForWorkspace($workspace, $viewer, 'viewer');

    $this->actingAs($viewer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.sprints.store', [$workspace, $project]), [
            'name' => 'Blocked sprint',
        ])
        ->assertForbidden();
});

test('project managers can add and remove tasks from sprints', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $task = createTaskForProject($project, $manager);
    $sprint = Sprint::create([
        'project_id' => $project->id,
        'name' => 'Test sprint',
        'status' => 'active',
    ]);

    $this->actingAs($manager)->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.sprints.add-task', [$workspace, $project, $sprint]), [
            'task_id' => $task->id,
        ])
        ->assertRedirect();

    expect($sprint->tasks()->where('task_id', $task->id)->exists())->toBeTrue();

    $this->actingAs($manager)->withSession(['current_workspace_id' => $workspace->id])
        ->delete(route('projects.sprints.remove-task', [$workspace, $project, $sprint]), [
            'task_id' => $task->id,
        ])
        ->assertRedirect();

    expect($sprint->tasks()->where('task_id', $task->id)->exists())->toBeFalse();
});

test('project managers can update and delete sprints attached to tasks', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $task = createTaskForProject($project, $manager);
    $sprint = Sprint::create([
        'project_id' => $project->id,
        'name' => 'Old sprint',
        'goal' => 'Old goal',
        'status' => 'planned',
    ]);
    $task->sprints()->attach($sprint->id);

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->put(route('projects.sprints.update', [$workspace, $project, $sprint]), [
            'name' => 'Updated sprint',
            'goal' => 'Updated goal',
            'status' => 'completed',
        ])
        ->assertRedirect();

    expect($sprint->refresh()->name)->toBe('Updated sprint')
        ->and($sprint->status)->toBe('completed')
        ->and($sprint->completed_at)->not->toBeNull();

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->delete(route('projects.sprints.destroy', [$workspace, $project, $sprint]))
        ->assertRedirect();

    expect(Sprint::whereKey($sprint->id)->exists())->toBeFalse()
        ->and($task->sprints()->count())->toBe(0);
});
