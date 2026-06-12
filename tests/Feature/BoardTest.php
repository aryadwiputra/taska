<?php

use App\Models\Board;
use App\Models\User;

test('project managers can create boards', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.boards.store', [$workspace, $project]), [
            'name' => 'Sprint Board',
            'type' => 'kanban',
        ])
        ->assertRedirect();

    $board = $project->boards()->where('name', 'Sprint Board')->first();

    expect($board)->not->toBeNull();
});

test('creating a board seeds default columns', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.boards.store', [$workspace, $project]), [
            'name' => 'Kanban',
        ])
        ->assertRedirect();

    $board = $project->boards()->where('name', 'Kanban')->first();

    expect($board->columns()->count())->toBe(4)
        ->and($board->columns()->orderBy('position')->pluck('name')->toArray())->toBe([
            'Todo', 'In Progress', 'Review', 'Done',
        ]);
});

test('first board created for a project is default', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.boards.store', [$workspace, $project]), [
            'name' => 'Default Board',
        ])
        ->assertRedirect();

    $board = $project->boards()->first();

    expect($board->is_default)->toBeTrue();
});

test('project managers can update boards', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $board = Board::factory()->create([
        'project_id' => $project->id,

        'name' => 'Old Name',
    ]);

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->put(route('projects.boards.update', [$workspace, $project, $board]), [
            'name' => 'New Name',
        ])
        ->assertRedirect();

    expect($board->refresh()->name)->toBe('New Name');
});

test('viewers cannot create boards', function () {
    $viewer = User::factory()->create();
    $workspace = createWorkspaceMember($viewer, 'manager');
    $project = createProjectForWorkspace($workspace, $viewer, 'viewer');

    $this->actingAs($viewer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.boards.store', [$workspace, $project]), [
            'name' => 'Hacked',
        ])
        ->assertForbidden();
});

test('viewers cannot update boards', function () {
    $viewer = User::factory()->create();
    $workspace = createWorkspaceMember($viewer, 'manager');
    $project = createProjectForWorkspace($workspace, $viewer, 'viewer');
    $board = Board::factory()->create([
        'project_id' => $project->id,

    ]);

    $this->actingAs($viewer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->put(route('projects.boards.update', [$workspace, $project, $board]), [
            'name' => 'Hacked',
        ])
        ->assertForbidden();
});

test('default board cannot be deleted', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.boards.store', [$workspace, $project]), [
            'name' => 'First Board',
        ]);

    $board = $project->boards()->first();

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->delete(route('projects.boards.destroy', [$workspace, $project, $board]))
        ->assertRedirect();

    expect(Board::whereKey($board->id)->exists())->toBeTrue();
});

test('non-default boards can be deleted', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $board = Board::factory()->create([
        'project_id' => $project->id,

        'is_default' => false,
    ]);

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->delete(route('projects.boards.destroy', [$workspace, $project, $board]))
        ->assertRedirect();

    expect(Board::whereKey($board->id)->exists())->toBeFalse();
});

test('project viewers cannot delete boards', function () {
    $viewer = User::factory()->create();
    $workspace = createWorkspaceMember($viewer, 'manager');
    $project = createProjectForWorkspace($workspace, $viewer, 'viewer');
    $board = Board::factory()->create([
        'project_id' => $project->id,

        'is_default' => false,
    ]);

    $this->actingAs($viewer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->delete(route('projects.boards.destroy', [$workspace, $project, $board]))
        ->assertForbidden();
});

test('project viewers can view the board', function () {
    $viewer = User::factory()->create();
    $workspace = createWorkspaceMember($viewer, 'viewer');
    $project = createProjectForWorkspace($workspace, $viewer, 'viewer');

    $this->actingAs($viewer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('projects.board', [$workspace, $project]))
        ->assertOk();
});

test('users outside a workspace cannot view its board', function () {
    $owner = User::factory()->create();
    $workspace = createWorkspaceMember($owner, 'owner');
    $project = createProjectForWorkspace($workspace, $owner);
    $outsider = User::factory()->create();

    $this->actingAs($outsider)
        ->get(route('projects.board', [$workspace, $project]))
        ->assertForbidden();
});
