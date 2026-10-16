<?php

use App\Models\Label;
use App\Models\User;

test('project members can search accessible tasks by code title and description', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'member');
    $project = createProjectForWorkspace($workspace, $user, 'developer');
    $matchingCode = createTaskForProject($project, $user);
    $matchingCode->update(['title' => 'Routine billing work']);
    $matchingTitle = createTaskForProject($project, $user);
    $matchingTitle->update(['title' => 'Build customer search']);
    $matchingDescription = createTaskForProject($project, $user);
    $matchingDescription->update(['title' => 'Plain task', 'description' => 'Contains searchable invoice notes']);
    $hidden = createTaskForProject($project, $user);
    $hidden->update(['title' => 'Unrelated task']);

    $this->actingAs($user)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('tasks.search', ['q' => 'search']))
        ->assertInertia(fn ($page) => $page
            ->component('tasks/search')
            ->has('tasks.data', 2)
            ->where('tasks.data.0.title', 'Build customer search')
            ->where('tasks.data.1.title', 'Plain task')
        );

    $this->actingAs($user)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('tasks.search', ['q' => $matchingCode->code]))
        ->assertInertia(fn ($page) => $page
            ->has('tasks.data', 1)
            ->where('tasks.data.0.id', $matchingCode->id)
        );
});

test('task search applies project status assignee reporter priority label and date filters', function () {
    $user = User::factory()->create();
    $assignee = User::factory()->create();
    $reporter = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'member');
    $workspace->members()->create(['user_id' => $assignee->id, 'role' => 'member', 'status' => 'active']);
    $workspace->members()->create(['user_id' => $reporter->id, 'role' => 'member', 'status' => 'active']);
    $project = createProjectForWorkspace($workspace, $user, 'developer');
    $project->members()->create(['user_id' => $assignee->id, 'role' => 'developer']);
    $project->members()->create(['user_id' => $reporter->id, 'role' => 'developer']);
    $priority = $workspace->priorities()->where('key', 'high')->first();
    $label = Label::create([
        'workspace_id' => $workspace->id,
        'project_id' => $project->id,
        'name' => 'Billing',
        'slug' => 'billing',
        'color' => '#2563eb',
    ]);
    $match = createTaskForProject($project, $reporter);
    $match->update([
        'title' => 'Filtered match',
        'status' => 'review',
        'priority_id' => $priority->id,
        'due_date' => '2026-06-20',
    ]);
    $match->forceFill(['created_at' => '2026-06-10 10:00:00'])->save();
    $match->assignees()->attach($assignee);
    $match->labels()->attach($label);
    $other = createTaskForProject($project, $user);
    $other->update(['title' => 'Filtered miss', 'status' => 'todo', 'due_date' => '2026-07-01']);

    $this->actingAs($user)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('tasks.search', [
            'workspace_id' => $workspace->id,
            'project_id' => $project->id,
            'status' => 'review',
            'assignee_id' => $assignee->id,
            'reporter_id' => $reporter->id,
            'priority_id' => $priority->id,
            'label_id' => $label->id,
            'due_from' => '2026-06-01',
            'due_to' => '2026-06-30',
            'created_from' => '2026-06-01',
            'created_to' => '2026-06-30',
        ]))
        ->assertInertia(fn ($page) => $page
            ->has('tasks.data', 1)
            ->where('tasks.data.0.id', $match->id)
            ->where('tasks.data.0.labels.0.name', 'Billing')
        );
});

test('task search excludes projects the user cannot access', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'member');
    $project = createProjectForWorkspace($workspace, $user, 'developer');
    $visible = createTaskForProject($project, $user);
    $visible->update(['title' => 'Shared roadmap']);
    $otherWorkspace = createWorkspaceMember($other, 'member');
    $otherProject = createProjectForWorkspace($otherWorkspace, $other, 'developer');
    $hidden = createTaskForProject($otherProject, $other);
    $hidden->update(['title' => 'Shared secret roadmap']);

    $this->actingAs($user)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('tasks.search', ['q' => 'roadmap', 'state' => 'all']))
        ->assertInertia(fn ($page) => $page
            ->has('tasks.data', 1)
            ->where('tasks.data.0.id', $visible->id)
        );
});

test('task search can show archived tasks separately', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'member');
    $project = createProjectForWorkspace($workspace, $user, 'developer');
    $active = createTaskForProject($project, $user);
    $active->update(['title' => 'Archive candidate']);
    $archived = createTaskForProject($project, $user);
    $archived->update(['title' => 'Archived candidate', 'archived_at' => now()]);

    $this->actingAs($user)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('tasks.search', ['q' => 'candidate', 'state' => 'archived']))
        ->assertInertia(fn ($page) => $page
            ->has('tasks.data', 1)
            ->where('tasks.data.0.id', $archived->id)
            ->where('tasks.data.0.title', 'Archived candidate')
        );
});

test('task search paginates results', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'member');
    $project = createProjectForWorkspace($workspace, $user, 'developer');

    foreach (range(1, 25) as $index) {
        $task = createTaskForProject($project, $user);
        $task->update(['title' => "Searchable task {$index}"]);
    }

    $this->actingAs($user)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('tasks.search', ['q' => 'Searchable']))
        ->assertInertia(fn ($page) => $page
            ->has('tasks.data', 20)
            ->where('tasks.current_page', 1)
            ->where('tasks.last_page', 2)
            ->where('tasks.total', 25)
        );
});
