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

test('project managers can start a planned sprint', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $sprint = Sprint::create([
        'project_id' => $project->id,
        'name' => 'Sprint 1',
        'status' => 'planned',
    ]);

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.sprints.start', [$workspace, $project, $sprint]))
        ->assertRedirect();

    $sprint->refresh();
    expect($sprint->status)->toBe('active')
        ->and($sprint->start_date)->not->toBeNull();
});

test('cannot start a non-planned sprint', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $sprint = Sprint::create([
        'project_id' => $project->id,
        'name' => 'Active sprint',
        'status' => 'active',
    ]);

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.sprints.start', [$workspace, $project, $sprint]))
        ->assertUnprocessable();
});

test('cannot start a sprint when another is active', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    Sprint::create([
        'project_id' => $project->id,
        'name' => 'Active sprint',
        'status' => 'active',
    ]);
    $planned = Sprint::create([
        'project_id' => $project->id,
        'name' => 'Planned sprint',
        'status' => 'planned',
    ]);

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.sprints.start', [$workspace, $project, $planned]))
        ->assertUnprocessable();
});

test('project managers can close an active sprint', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $sprint = Sprint::create([
        'project_id' => $project->id,
        'name' => 'Sprint 1',
        'status' => 'active',
    ]);

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.sprints.close', [$workspace, $project, $sprint]))
        ->assertRedirect();

    $sprint->refresh();
    expect($sprint->status)->toBe('completed')
        ->and($sprint->completed_at)->not->toBeNull()
        ->and($sprint->end_date)->not->toBeNull();
});

test('cannot close a non-active sprint', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $sprint = Sprint::create([
        'project_id' => $project->id,
        'name' => 'Planned sprint',
        'status' => 'planned',
    ]);

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.sprints.close', [$workspace, $project, $sprint]))
        ->assertUnprocessable();
});

test('project members can view sprint report', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $sprint = Sprint::create([
        'project_id' => $project->id,
        'name' => 'Sprint 1',
        'status' => 'completed',
        'start_date' => '2026-06-01',
        'end_date' => '2026-06-14',
    ]);

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('projects.sprints.report', [$workspace, $project, $sprint]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('projects/sprints/report'));
});

test('project viewers cannot start or close sprints', function () {
    $viewer = User::factory()->create();
    $workspace = createWorkspaceMember($viewer, 'manager');
    $project = createProjectForWorkspace($workspace, $viewer, 'viewer');
    $sprint = Sprint::create([
        'project_id' => $project->id,
        'name' => 'Sprint 1',
        'status' => 'planned',
    ]);

    $this->actingAs($viewer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.sprints.start', [$workspace, $project, $sprint]))
        ->assertForbidden();

    $sprint->update(['status' => 'active']);

    $this->actingAs($viewer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.sprints.close', [$workspace, $project, $sprint]))
        ->assertForbidden();
});
