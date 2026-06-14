<?php

use App\Models\User;

test('guests are redirected to login', function () {
    $this->get(route('my-tasks.index'))
        ->assertRedirect(route('login'));
});

test('authenticated users can view my tasks page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('my-tasks.index'))
        ->assertOk();
});

test('my tasks page renders with correct props', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->get(route('my-tasks.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('my-tasks')
        ->has('tasks')
        ->has('projects')
        ->has('filters')
    );
});

test('my tasks shows only assigned tasks', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');
    $project = createProjectForWorkspace($workspace, $user, 'lead');

    $assignedTask = createTaskForProject($project, $user);
    $assignedTask->assignees()->attach($user);

    $unassignedTask = createTaskForProject($project, $user);

    $this->actingAs($user)
        ->get(route('my-tasks.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('tasks.data', 1)
            ->where('tasks.data.0.id', $assignedTask->id)
        );
});

test('my tasks filters by status', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');
    $project = createProjectForWorkspace($workspace, $user, 'lead');

    $todoTask = createTaskForProject($project, $user);
    $todoTask->assignees()->attach($user);

    $doneTask = createTaskForProject($project, $user);
    $doneTask->assignees()->attach($user);
    $doneColumn = $project->boards()->first()->columns()->where('status_key', 'done')->first();
    $doneTask->update(['board_column_id' => $doneColumn->id, 'status' => 'done']);

    $this->actingAs($user)
        ->get(route('my-tasks.index', ['status' => 'todo']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('tasks.data', 1)
            ->where('tasks.data.0.id', $todoTask->id)
        );
});

test('my tasks excludes completed tasks', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');
    $project = createProjectForWorkspace($workspace, $user, 'lead');

    $activeTask = createTaskForProject($project, $user);
    $activeTask->assignees()->attach($user);

    $completedTask = createTaskForProject($project, $user);
    $completedTask->assignees()->attach($user);
    $completedTask->update(['completed_at' => now()]);

    $this->actingAs($user)
        ->get(route('my-tasks.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('tasks.data', 1)
            ->where('tasks.data.0.id', $activeTask->id)
        );
});

test('my tasks returns user projects for filter', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');
    $project = createProjectForWorkspace($workspace, $user, 'lead');

    $this->actingAs($user)
        ->get(route('my-tasks.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('projects', 1)
            ->where('projects.0.id', $project->id)
        );
});
