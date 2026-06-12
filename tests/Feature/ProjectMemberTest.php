<?php

use App\Models\User;
use App\Services\WorkspaceRoleService;

test('project lead can add a member', function () {
    $lead = User::factory()->create();
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($lead, 'manager');
    $workspace->members()->create(['user_id' => $user->id, 'role' => 'member', 'status' => 'active']);
    app(WorkspaceRoleService::class)->syncRole($user, $workspace, 'member');
    $project = createProjectForWorkspace($workspace, $lead, 'lead');

    $this->actingAs($lead)->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.members.store', [$workspace, $project]), [
            'user_id' => $user->id,
            'role' => 'developer',
        ])
        ->assertRedirect();

    expect($project->members()->where('user_id', $user->id)->exists())->toBeTrue();
});

test('project manager can add a member', function () {
    $manager = User::factory()->create();
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $workspace->members()->create(['user_id' => $user->id, 'role' => 'member', 'status' => 'active']);
    app(WorkspaceRoleService::class)->syncRole($user, $workspace, 'member');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');

    $this->actingAs($manager)->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.members.store', [$workspace, $project]), [
            'user_id' => $user->id,
            'role' => 'developer',
        ])
        ->assertRedirect();
});

test('project viewer cannot add a member', function () {
    $viewer = User::factory()->create();
    $workspace = createWorkspaceMember($viewer, 'viewer');
    $project = createProjectForWorkspace($workspace, $viewer, 'viewer');

    $this->actingAs($viewer)->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.members.store', [$workspace, $project]), [
            'user_id' => $viewer->id,
            'role' => 'developer',
        ])
        ->assertForbidden();
});

test('project lead can update member role', function () {
    $lead = User::factory()->create();
    $member = User::factory()->create();
    $workspace = createWorkspaceMember($lead, 'manager');
    $workspace->members()->create(['user_id' => $member->id, 'role' => 'member', 'status' => 'active']);
    app(WorkspaceRoleService::class)->syncRole($member, $workspace, 'member');
    $project = createProjectForWorkspace($workspace, $lead, 'lead');
    $project->members()->create(['user_id' => $member->id, 'role' => 'member']);
    $projMember = $project->members()->where('user_id', $member->id)->first();

    $this->actingAs($lead)->withSession(['current_workspace_id' => $workspace->id])
        ->put(route('projects.members.update', [$workspace, $project, $projMember]), [
            'role' => 'developer',
        ])
        ->assertRedirect();

    expect($projMember->refresh()->role)->toBe('developer');
});

test('project lead can remove a member', function () {
    $lead = User::factory()->create();
    $member = User::factory()->create();
    $workspace = createWorkspaceMember($lead, 'manager');
    $workspace->members()->create(['user_id' => $member->id, 'role' => 'member', 'status' => 'active']);
    app(WorkspaceRoleService::class)->syncRole($member, $workspace, 'member');
    $project = createProjectForWorkspace($workspace, $lead, 'lead');
    $project->members()->create(['user_id' => $member->id, 'role' => 'member']);
    $projMember = $project->members()->where('user_id', $member->id)->first();

    $this->actingAs($lead)->withSession(['current_workspace_id' => $workspace->id])
        ->delete(route('projects.members.destroy', [$workspace, $project, $projMember]))
        ->assertRedirect();

    expect($project->members()->where('user_id', $member->id)->exists())->toBeFalse();
});

test('cannot remove last lead from project', function () {
    $lead = User::factory()->create();
    $workspace = createWorkspaceMember($lead, 'manager');
    $project = createProjectForWorkspace($workspace, $lead, 'lead');
    $projMember = $project->members()->where('user_id', $lead->id)->first();

    $this->actingAs($lead)->withSession(['current_workspace_id' => $workspace->id])
        ->delete(route('projects.members.destroy', [$workspace, $project, $projMember]))
        ->assertRedirect();

    expect($project->members()->where('role', 'lead')->exists())->toBeTrue();
});

test('project member store validates required fields', function () {
    $lead = User::factory()->create();
    $workspace = createWorkspaceMember($lead, 'manager');
    $project = createProjectForWorkspace($workspace, $lead, 'lead');

    $this->actingAs($lead)->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.members.store', [$workspace, $project]), [])
        ->assertSessionHasErrors(['user_id', 'role']);
});

test('project member store rejects duplicate members', function () {
    $lead = User::factory()->create();
    $workspace = createWorkspaceMember($lead, 'manager');
    $project = createProjectForWorkspace($workspace, $lead, 'lead');

    $this->actingAs($lead)->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.members.store', [$workspace, $project]), [
            'user_id' => $lead->id,
            'role' => 'developer',
        ])
        ->assertSessionHasErrors('user_id');
});

test('project member store rejects invalid role', function () {
    $lead = User::factory()->create();
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($lead, 'manager');
    $workspace->members()->create(['user_id' => $user->id, 'role' => 'member', 'status' => 'active']);
    app(WorkspaceRoleService::class)->syncRole($user, $workspace, 'member');
    $project = createProjectForWorkspace($workspace, $lead, 'lead');

    $this->actingAs($lead)->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.members.store', [$workspace, $project]), [
            'user_id' => $user->id,
            'role' => 'invalid-role',
        ])
        ->assertSessionHasErrors('role');
});

test('project member update validates role', function () {
    $lead = User::factory()->create();
    $workspace = createWorkspaceMember($lead, 'manager');
    $project = createProjectForWorkspace($workspace, $lead, 'lead');
    $projMember = $project->members()->where('user_id', $lead->id)->first();

    $this->actingAs($lead)->withSession(['current_workspace_id' => $workspace->id])
        ->put(route('projects.members.update', [$workspace, $project, $projMember]), [
            'role' => 'invalid-role',
        ])
        ->assertSessionHasErrors('role');
});
