<?php

use App\Models\User;

test('dashboard shows correct stats for user with tasks', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');
    $project = createProjectForWorkspace($workspace, $user, 'lead');

    // Create assigned task
    $assignedTask = createTaskForProject($project, $user);
    $assignedTask->assignees()->attach($user);

    // Create overdue task
    $overdueTask = createTaskForProject($project, $user);
    $overdueTask->assignees()->attach($user);
    $overdueTask->update(['due_date' => now()->subDay()]);

    // Create upcoming deadline task
    $upcomingTask = createTaskForProject($project, $user);
    $upcomingTask->assignees()->attach($user);
    $upcomingTask->update(['due_date' => now()->addDays(3)]);

    $this->actingAs($user)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('stats.assigned', 3)
            ->where('stats.overdue', 1)
            ->where('stats.activeProjects', 1)
            ->where('stats.upcomingDeadlines', 1)
        );
});

test('dashboard shows zero stats for user with no tasks', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');

    $this->actingAs($user)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('stats.assigned', 0)
            ->where('stats.overdue', 0)
            ->where('stats.activeProjects', 0)
            ->where('stats.upcomingDeadlines', 0)
        );
});

test('dashboard stats exclude completed tasks', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');
    $project = createProjectForWorkspace($workspace, $user, 'lead');

    $completedTask = createTaskForProject($project, $user);
    $completedTask->assignees()->attach($user);
    $completedTask->update(['completed_at' => now()]);

    $this->actingAs($user)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('stats.assigned', 0)
            ->where('stats.overdue', 0)
        );
});

test('dashboard stats count only active projects', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');

    $activeProject = createProjectForWorkspace($workspace, $user, 'lead');
    $activeProject->update(['status' => 'active']);

    $archivedProject = createProjectForWorkspace($workspace, $user, 'lead');
    $archivedProject->update(['status' => 'archived']);

    $this->actingAs($user)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('stats.activeProjects', 1)
        );
});

test('dashboard stats count upcoming deadlines within 7 days', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');
    $project = createProjectForWorkspace($workspace, $user, 'lead');

    // Task due in 3 days
    $task3Days = createTaskForProject($project, $user);
    $task3Days->assignees()->attach($user);
    $task3Days->update(['due_date' => now()->addDays(3)]);

    // Task due in 10 days (should not be counted)
    $task10Days = createTaskForProject($project, $user);
    $task10Days->assignees()->attach($user);
    $task10Days->update(['due_date' => now()->addDays(10)]);

    $this->actingAs($user)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('stats.upcomingDeadlines', 1)
        );
});

test('dashboard stats count overdue tasks', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');
    $project = createProjectForWorkspace($workspace, $user, 'lead');

    // Overdue task
    $overdueTask = createTaskForProject($project, $user);
    $overdueTask->assignees()->attach($user);
    $overdueTask->update(['due_date' => now()->subDay()]);

    // Task due today (not overdue)
    $todayTask = createTaskForProject($project, $user);
    $todayTask->assignees()->attach($user);
    $todayTask->update(['due_date' => now()->startOfDay()]);

    $this->actingAs($user)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('stats.overdue', 1)
        );
});
