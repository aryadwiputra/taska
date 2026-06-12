<?php

use App\Models\User;
use App\Services\WorkspaceRoleService;

test('workspace owner can list members', function () {
    $owner = User::factory()->create();
    $workspace = createWorkspaceMember($owner, 'owner');

    $this->actingAs($owner)->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('workspaces.members.index', $workspace))
        ->assertSuccessful();
});

test('workspace members index returns member data', function () {
    $owner = User::factory()->create();
    $workspace = createWorkspaceMember($owner, 'owner');

    $this->actingAs($owner)->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('workspaces.members.index', $workspace))
        ->assertJsonFragment(['role' => 'owner']);
});

test('workspace owner can add a member', function () {
    $owner = User::factory()->create();
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($owner, 'owner');

    $this->actingAs($owner)->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('workspaces.members.store', $workspace), [
            'user_id' => $user->id,
            'role' => 'member',
        ])
        ->assertRedirect();

    expect($workspace->members()->where('user_id', $user->id)->exists())->toBeTrue();
});

test('workspace admin can add a member', function () {
    $admin = User::factory()->create();
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($admin, 'admin');

    $this->actingAs($admin)->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('workspaces.members.store', $workspace), [
            'user_id' => $user->id,
            'role' => 'manager',
        ])
        ->assertRedirect();
});

test('workspace viewer cannot add a member', function () {
    $viewer = User::factory()->create();
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($viewer, 'viewer');

    $this->actingAs($viewer)->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('workspaces.members.store', $workspace), [
            'user_id' => $user->id,
            'role' => 'member',
        ])
        ->assertForbidden();
});

test('workspace owner can update member role', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create();
    $workspace = createWorkspaceMember($owner, 'owner');
    $workspace->members()->create(['user_id' => $member->id, 'role' => 'member', 'status' => 'active']);
    app(WorkspaceRoleService::class)->syncRole($member, $workspace, 'member');
    $wsMember = $workspace->members()->where('user_id', $member->id)->first();

    $this->actingAs($owner)->withSession(['current_workspace_id' => $workspace->id])
        ->put(route('workspaces.members.update', [$workspace, $wsMember]), [
            'role' => 'manager',
        ])
        ->assertRedirect();

    expect($wsMember->refresh()->role)->toBe('manager');
});

test('workspace owner can remove a member', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create();
    $workspace = createWorkspaceMember($owner, 'owner');
    $workspace->members()->create(['user_id' => $member->id, 'role' => 'member', 'status' => 'active']);
    $wsMember = $workspace->members()->where('user_id', $member->id)->first();

    $this->actingAs($owner)->withSession(['current_workspace_id' => $workspace->id])
        ->delete(route('workspaces.members.destroy', [$workspace, $wsMember]))
        ->assertRedirect();

    expect($workspace->members()->where('user_id', $member->id)->exists())->toBeFalse();
});

test('cannot remove last owner from workspace', function () {
    $owner = User::factory()->create();
    $workspace = createWorkspaceMember($owner, 'owner');
    $wsMember = $workspace->members()->where('user_id', $owner->id)->first();

    $this->actingAs($owner)->withSession(['current_workspace_id' => $workspace->id])
        ->delete(route('workspaces.members.destroy', [$workspace, $wsMember]))
        ->assertRedirect();

    expect($workspace->members()->where('role', 'owner')->exists())->toBeTrue();
});

test('workspace member store validates required fields', function () {
    $owner = User::factory()->create();
    $workspace = createWorkspaceMember($owner, 'owner');

    $this->actingAs($owner)->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('workspaces.members.store', $workspace), [])
        ->assertSessionHasErrors(['user_id', 'role']);
});

test('workspace member store rejects duplicate members', function () {
    $owner = User::factory()->create();
    $workspace = createWorkspaceMember($owner, 'owner');
    $existing = $workspace->members()->where('user_id', $owner->id)->first();

    $this->actingAs($owner)->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('workspaces.members.store', $workspace), [
            'user_id' => $owner->id,
            'role' => 'member',
        ])
        ->assertSessionHasErrors('user_id');
});

test('workspace member store rejects invalid role', function () {
    $owner = User::factory()->create();
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($owner, 'owner');

    $this->actingAs($owner)->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('workspaces.members.store', $workspace), [
            'user_id' => $user->id,
            'role' => 'invalid-role',
        ])
        ->assertSessionHasErrors('role');
});

test('workspace member update validates role', function () {
    $owner = User::factory()->create();
    $workspace = createWorkspaceMember($owner, 'owner');
    $wsMember = $workspace->members()->where('user_id', $owner->id)->first();

    $this->actingAs($owner)->withSession(['current_workspace_id' => $workspace->id])
        ->put(route('workspaces.members.update', [$workspace, $wsMember]), [
            'role' => 'invalid-role',
        ])
        ->assertSessionHasErrors('role');
});

test('workspace viewer cannot list members', function () {
    $viewer = User::factory()->create();
    $workspace = createWorkspaceMember($viewer, 'viewer');

    $this->actingAs($viewer)->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('workspaces.members.index', $workspace))
        ->assertForbidden();
});
