<?php

use App\Models\Release;
use App\Models\User;

test('project managers can create releases', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.releases.store', [$workspace, $project]), [
            'name' => 'v1.0',
            'description' => 'First release',
            'release_date' => now()->addMonth()->toDateString(),
            'status' => 'draft',
        ])
        ->assertCreated();

    expect($project->releases()->where('name', 'v1.0')->exists())->toBeTrue();
});

test('project viewers cannot create releases', function () {
    $viewer = User::factory()->create();
    $workspace = createWorkspaceMember($viewer, 'manager');
    $project = createProjectForWorkspace($workspace, $viewer, 'viewer');

    $this->actingAs($viewer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.releases.store', [$workspace, $project]), [
            'name' => 'v1.0',
            'release_date' => now()->toDateString(),
        ])
        ->assertForbidden();
});

test('project managers can update releases', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');

    $release = Release::create([
        'project_id' => $project->id,
        'created_by' => $manager->id,
        'name' => 'v1.0',
        'status' => 'draft',
        'release_date' => now()->toDateString(),
    ]);

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->put(route('projects.releases.update', [$workspace, $project, $release]), [
            'name' => 'v2.0',
            'release_date' => now()->addWeek()->toDateString(),
            'status' => 'scheduled',
        ])
        ->assertOk();

    expect($release->refresh()->name)->toBe('v2.0')
        ->and($release->status)->toBe('scheduled');
});

test('project managers can delete releases', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');

    $release = Release::create([
        'project_id' => $project->id,
        'created_by' => $manager->id,
        'name' => 'v1.0',
        'status' => 'draft',
        'release_date' => now()->toDateString(),
    ]);

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->delete(route('projects.releases.destroy', [$workspace, $project, $release]))
        ->assertOk();

    expect(Release::whereKey($release->id)->exists())->toBeFalse();
});

test('it renders releases index page', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('projects.releases.index', [$workspace, $project]))
        ->assertOk();
});

test('project managers can add and remove tasks from releases', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $task = createTaskForProject($project, $manager);

    $release = Release::create([
        'project_id' => $project->id,
        'created_by' => $manager->id,
        'name' => 'v1.0',
        'status' => 'draft',
        'release_date' => now()->toDateString(),
    ]);

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.releases.add-task', [$workspace, $project, $release]), [
            'task_id' => $task->id,
        ])
        ->assertOk();

    expect((int) $release->tasks()->count())->toBe(1);

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.releases.remove-task', [$workspace, $project, $release]), [
            'task_id' => $task->id,
        ])
        ->assertOk();

    expect((int) $release->tasks()->count())->toBe(0);
});
