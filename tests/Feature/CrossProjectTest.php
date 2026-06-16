<?php

use App\Models\User;

test('workspace members can view cross-project timeline', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('workspaces.cross-project.timeline', $workspace))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('workspaces/cross-project/timeline'));
});

test('workspace members can view cross-project board', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('workspaces.cross-project.board', $workspace))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('workspaces/cross-project/board'));
});
