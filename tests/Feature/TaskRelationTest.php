<?php

use App\Models\User;
use App\Services\WorkspaceRoleService;

test('authorized users can toggle watch on a task', function () {
    $developer = User::factory()->create();
    $workspace = createWorkspaceMember($developer, 'manager');
    $project = createProjectForWorkspace($workspace, $developer, 'developer');
    $task = createTaskForProject($project, $developer);

    // Watch
    $this->actingAs($developer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->patch(route('projects.tasks.update', [$workspace, $project, $task]), [
            'watcher_ids' => [$developer->id],
        ])
        ->assertRedirect();

    expect($task->watchers()->where('users.id', $developer->id)->exists())->toBeTrue();

    // Unwatch
    $this->actingAs($developer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->patch(route('projects.tasks.update', [$workspace, $project, $task]), [
            'watcher_ids' => [],
        ])
        ->assertRedirect();

    $task->refresh();
    expect($task->watchers()->where('users.id', $developer->id)->exists())->toBeFalse();
});

test('authorized users can set parent task', function () {
    $developer = User::factory()->create();
    $workspace = createWorkspaceMember($developer, 'manager');
    $project = createProjectForWorkspace($workspace, $developer, 'developer');
    $parent = createTaskForProject($project, $developer);
    $child = createTaskForProject($project, $developer);

    $this->actingAs($developer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->patch(route('projects.tasks.update', [$workspace, $project, $child]), [
            'parent_id' => $parent->id,
        ])
        ->assertRedirect();

    $child->refresh();
    expect($child->parent_id)->toBe($parent->id);
});

test('authorized users can create and remove task relations', function () {
    $developer = User::factory()->create();
    $workspace = createWorkspaceMember($developer, 'manager');
    $project = createProjectForWorkspace($workspace, $developer, 'developer');
    $taskA = createTaskForProject($project, $developer);
    $taskB = createTaskForProject($project, $developer);

    // Create relation
    $this->actingAs($developer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.tasks.relations.store', [$workspace, $project, $taskA]), [
            'related_task_id' => $taskB->id,
            'relation_type' => 'blocks',
        ])
        ->assertRedirect();

    expect($taskA->relatedTasks()->where('related_task_id', $taskB->id)->exists())->toBeTrue();

    // Remove relation
    $relation = $taskA->relatedTasks()->first();
    $this->actingAs($developer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->delete(route('projects.tasks.relations.destroy', [$workspace, $project, $taskA, $relation]))
        ->assertRedirect();

    $taskA->refresh();
    expect($taskA->relatedTasks()->count())->toBe(0);
});

test('unauthorized users cannot manage task relations', function () {
    $viewer = User::factory()->create();
    $workspace = createWorkspaceMember($viewer, 'viewer');
    $project = createProjectForWorkspace($workspace, $viewer, 'viewer');
    $taskA = createTaskForProject($project, $viewer);
    $taskB = createTaskForProject($project, $viewer);

    $this->actingAs($viewer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.tasks.relations.store', [$workspace, $project, $taskA]), [
            'related_task_id' => $taskB->id,
            'relation_type' => 'blocks',
        ])
        ->assertForbidden();
});

test('sub-task creation logs parent change activity', function () {
    $developer = User::factory()->create();
    $workspace = createWorkspaceMember($developer, 'manager');
    $project = createProjectForWorkspace($workspace, $developer, 'developer');
    $parent = createTaskForProject($project, $developer);
    $taskType = $workspace->taskTypes()->first();

    $this->actingAs($developer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.tasks.store', [$workspace, $project]), [
            'title' => 'Sub-task',
            'task_type_id' => $taskType->id,
            'parent_id' => $parent->id,
        ])
        ->assertRedirect();

    $child = $project->tasks()->where('title', 'Sub-task')->first();
    expect($child->parent_id)->toBe($parent->id);
});

test('watcher toggle logs activity', function () {
    $developer = User::factory()->create();
    $watcher = User::factory()->create();
    $workspace = createWorkspaceMember($developer, 'manager');
    $workspace->members()->create([
        'user_id' => $watcher->id,
        'role' => 'member',
        'status' => 'active',
    ]);
    app(WorkspaceRoleService::class)->syncRole($watcher, $workspace, 'member');
    $project = createProjectForWorkspace($workspace, $developer, 'developer');
    $project->members()->create([
        'user_id' => $watcher->id,
        'role' => 'developer',
    ]);
    $task = createTaskForProject($project, $developer);

    $this->actingAs($developer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->patch(route('projects.tasks.update', [$workspace, $project, $task]), [
            'watcher_ids' => [$watcher->id],
        ])
        ->assertRedirect();

    expect($task->activities()->where('action', 'watcher_added')->exists())->toBeTrue();
});

test('parent task returns children in show JSON response', function () {
    $developer = User::factory()->create();
    $workspace = createWorkspaceMember($developer, 'manager');
    $project = createProjectForWorkspace($workspace, $developer, 'developer');
    $parent = createTaskForProject($project, $developer);
    $taskType = $workspace->taskTypes()->first();

    $this->actingAs($developer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.tasks.store', [$workspace, $project]), [
            'title' => 'Sub-task 1',
            'task_type_id' => $taskType->id,
            'parent_id' => $parent->id,
        ])
        ->assertRedirect();

    $response = $this->actingAs($developer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->getJson(route('projects.tasks.show', [$workspace, $project, $parent]), [
            'Accept' => 'application/json',
        ]);

    $response->assertOk();
    $response->assertJsonPath('task.children.0.title', 'Sub-task 1');
});

test('children count increases after creating sub-task', function () {
    $developer = User::factory()->create();
    $workspace = createWorkspaceMember($developer, 'manager');
    $project = createProjectForWorkspace($workspace, $developer, 'developer');
    $parent = createTaskForProject($project, $developer);
    $taskType = $workspace->taskTypes()->first();

    $parent->refresh();
    expect($parent->children()->count())->toBe(0);

    $this->actingAs($developer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.tasks.store', [$workspace, $project]), [
            'title' => 'Sub-task',
            'task_type_id' => $taskType->id,
            'parent_id' => $parent->id,
        ])
        ->assertRedirect();

    $parent->refresh();
    expect($parent->children()->count())->toBe(1);
    expect($parent->children()->first()->title)->toBe('Sub-task');
});

test('multiple children are returned correctly', function () {
    $developer = User::factory()->create();
    $workspace = createWorkspaceMember($developer, 'manager');
    $project = createProjectForWorkspace($workspace, $developer, 'developer');
    $parent = createTaskForProject($project, $developer);
    $taskType = $workspace->taskTypes()->first();

    foreach (['Sub-task 1', 'Sub-task 2', 'Sub-task 3'] as $title) {
        $this->actingAs($developer)
            ->withSession(['current_workspace_id' => $workspace->id])
            ->post(route('projects.tasks.store', [$workspace, $project]), [
                'title' => $title,
                'task_type_id' => $taskType->id,
                'parent_id' => $parent->id,
            ]);
    }

    $response = $this->actingAs($developer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->getJson(route('projects.tasks.show', [$workspace, $project, $parent]), [
            'Accept' => 'application/json',
        ]);

    $response->assertOk();
    $response->assertJsonPath('task.children', fn ($children) => count($children) === 3);
});
