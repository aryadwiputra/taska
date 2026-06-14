<?php

use App\Models\User;

test('authenticated users can create a workspace and become owner', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('workspaces.store'), [
            'name' => 'Engineering',
            'slug' => 'engineering',
            'description' => 'Product engineering workspace.',
        ])
        ->assertRedirect(route('workspaces.settings', 'engineering'));

    $workspace = $user->workspaces()->where('slug', 'engineering')->first();

    expect($workspace)->not->toBeNull();
    expect($workspace->pivot->role)->toBe('owner');
});

test('workspace viewers cannot update workspace settings', function () {
    $viewer = User::factory()->create();
    $workspace = createWorkspaceMember($viewer, 'viewer');

    $this->actingAs($viewer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->put(route('workspaces.update', $workspace), [
            'name' => 'Blocked update',
            'slug' => $workspace->slug,
            'description' => 'Nope.',
        ])
        ->assertForbidden();
});

test('authenticated users can visit workspace show page', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');

    $this->actingAs($user)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('workspaces.show', $workspace))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('workspaces/show')
            ->has('workspace')
            ->has('projects')
        );
});

test('workspace show page displays projects', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');
    $project = createProjectForWorkspace($workspace, $user, 'lead');

    $this->actingAs($user)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('workspaces.show', $workspace))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('projects.0.id', $project->id)
            ->where('projects.0.name', $project->name)
        );
});
