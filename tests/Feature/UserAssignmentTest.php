<?php

use App\Models\User;
use App\Services\WorkspaceRoleService;

test('workspace admin can view user assignments', function () {
    $admin = User::factory()->create();
    $workspace = createWorkspaceMember($admin, 'admin');
    $project = createProjectForWorkspace($workspace, $admin, 'lead');

    $this->actingAs($admin)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->getJson(route('workspaces.user-assignments.index', [$workspace]))
        ->assertOk()
        ->assertJsonStructure([
            'users' => [
                ['user_id', 'name', 'email', 'workspace_role', 'assignments'],
            ],
            'projects' => [
                ['id', 'name', 'key'],
            ],
        ]);
});

test('workspace admin can assign user to project', function () {
    $admin = User::factory()->create();
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($admin, 'admin');
    $workspace->members()->create(['user_id' => $user->id, 'role' => 'member', 'status' => 'active']);
    app(WorkspaceRoleService::class)->syncRole($user, $workspace, 'member');
    $project = createProjectForWorkspace($workspace, $admin, 'lead');

    $this->actingAs($admin)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->postJson(route('workspaces.user-assignments.store', [$workspace]), [
            'user_id' => $user->id,
            'project_id' => $project->id,
            'role' => 'developer',
        ])
        ->assertCreated();

    expect($project->members()->where('user_id', $user->id)->exists())->toBeTrue();
});

test('workspace admin can update user project role', function () {
    $admin = User::factory()->create();
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($admin, 'admin');
    $workspace->members()->create(['user_id' => $user->id, 'role' => 'member', 'status' => 'active']);
    app(WorkspaceRoleService::class)->syncRole($user, $workspace, 'member');
    $project = createProjectForWorkspace($workspace, $admin, 'lead');
    $project->members()->create(['user_id' => $user->id, 'role' => 'member']);
    $member = $project->members()->where('user_id', $user->id)->first();

    $this->actingAs($admin)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->putJson(route('workspaces.user-assignments.update', [$workspace, $member]), [
            'role' => 'developer',
        ])
        ->assertOk();

    expect($member->refresh()->role)->toBe('developer');
});

test('workspace admin can bulk assign users to projects', function () {
    $admin = User::factory()->create();
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $workspace = createWorkspaceMember($admin, 'admin');
    $workspace->members()->create(['user_id' => $user1->id, 'role' => 'member', 'status' => 'active']);
    $workspace->members()->create(['user_id' => $user2->id, 'role' => 'member', 'status' => 'active']);
    app(WorkspaceRoleService::class)->syncRole($user1, $workspace, 'member');
    app(WorkspaceRoleService::class)->syncRole($user2, $workspace, 'member');
    $project = createProjectForWorkspace($workspace, $admin, 'lead');

    $this->actingAs($admin)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->postJson(route('workspaces.user-assignments.bulk-store', [$workspace]), [
            'user_ids' => [$user1->id, $user2->id],
            'project_ids' => [$project->id],
            'role' => 'developer',
        ])
        ->assertCreated();

    expect($project->members()->where('user_id', $user1->id)->exists())->toBeTrue();
    expect($project->members()->where('user_id', $user2->id)->exists())->toBeTrue();
});

test('workspace admin can remove user from project', function () {
    $admin = User::factory()->create();
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($admin, 'admin');
    $workspace->members()->create(['user_id' => $user->id, 'role' => 'member', 'status' => 'active']);
    app(WorkspaceRoleService::class)->syncRole($user, $workspace, 'member');
    $project = createProjectForWorkspace($workspace, $admin, 'lead');
    $project->members()->create(['user_id' => $user->id, 'role' => 'member']);
    $member = $project->members()->where('user_id', $user->id)->first();

    $this->actingAs($admin)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->deleteJson(route('workspaces.user-assignments.destroy', [$workspace, $member]))
        ->assertStatus(204);

    expect($project->members()->where('user_id', $user->id)->exists())->toBeFalse();
});

test('cannot remove last lead from project via user assignments', function () {
    $admin = User::factory()->create();
    $workspace = createWorkspaceMember($admin, 'admin');
    $project = createProjectForWorkspace($workspace, $admin, 'lead');
    $member = $project->members()->where('user_id', $admin->id)->first();

    $this->actingAs($admin)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->deleteJson(route('workspaces.user-assignments.destroy', [$workspace, $member]))
        ->assertStatus(422);

    expect($project->members()->where('role', 'lead')->exists())->toBeTrue();
});

test('non-admin cannot access user assignments', function () {
    $viewer = User::factory()->create();
    $workspace = createWorkspaceMember($viewer, 'viewer');

    $this->actingAs($viewer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->getJson(route('workspaces.user-assignments.index', [$workspace]))
        ->assertForbidden();
});

test('search filters users by name', function () {
    $admin = User::factory()->create();
    $workspace = createWorkspaceMember($admin, 'admin');

    $this->actingAs($admin)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->getJson(route('workspaces.user-assignments.index', [$workspace, 'q' => $admin->name]))
        ->assertOk()
        ->assertJsonPath('users.0.name', $admin->name);
});
