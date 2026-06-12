<?php

use App\Models\Board;
use App\Models\BoardColumn;
use App\Models\User;

test('project managers can add columns to a board', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $board = Board::factory()->create([
        'project_id' => $project->id,
    ]);

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.boards.columns.store', [$workspace, $project, $board]), [
            'name' => 'Blocked',
            'status_key' => 'blocked',
        ])
        ->assertRedirect();

    expect($board->columns()->where('status_key', 'blocked')->exists())->toBeTrue();
});

test('new column gets auto-incremented position', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $board = Board::factory()->create([
        'project_id' => $project->id,
    ]);
    $board->columns()->create(['name' => 'Col 1', 'status_key' => 'col1', 'position' => 0]);

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.boards.columns.store', [$workspace, $project, $board]), [
            'name' => 'Col 2',
            'status_key' => 'col2',
        ])
        ->assertRedirect();

    expect($board->columns()->where('status_key', 'col2')->first()->position)->toBe(1);
});

test('viewers cannot add columns', function () {
    $viewer = User::factory()->create();
    $workspace = createWorkspaceMember($viewer, 'manager');
    $project = createProjectForWorkspace($workspace, $viewer, 'viewer');
    $board = Board::factory()->create([
        'project_id' => $project->id,

    ]);

    $this->actingAs($viewer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.boards.columns.store', [$workspace, $project, $board]), [
            'name' => 'Hacked',
            'status_key' => 'hacked',
        ])
        ->assertForbidden();
});

test('project managers can update columns', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $board = Board::factory()->create([
        'project_id' => $project->id,

    ]);
    $column = $board->columns()->create([
        'name' => 'Old Name',
        'status_key' => 'old',
        'position' => 0,
    ]);

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->put(route('projects.boards.columns.update', [$workspace, $project, $board, $column]), [
            'name' => 'New Name',
            'color' => '#ef4444',
            'is_done_column' => true,
        ])
        ->assertRedirect();

    $column->refresh();

    expect($column->name)->toBe('New Name')
        ->and($column->color)->toBe('#ef4444')
        ->and($column->is_done_column)->toBeTrue();
});

test('viewers cannot update columns', function () {
    $viewer = User::factory()->create();
    $workspace = createWorkspaceMember($viewer, 'manager');
    $project = createProjectForWorkspace($workspace, $viewer, 'viewer');
    $board = Board::factory()->create([
        'project_id' => $project->id,

    ]);
    $column = $board->columns()->create([
        'name' => 'Col',
        'status_key' => 'col',
        'position' => 0,
    ]);

    $this->actingAs($viewer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->put(route('projects.boards.columns.update', [$workspace, $project, $board, $column]), [
            'name' => 'Hacked',
        ])
        ->assertForbidden();
});

test('project managers can delete columns', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $board = Board::factory()->create([
        'project_id' => $project->id,

    ]);
    $column = $board->columns()->create([
        'name' => 'To Delete',
        'status_key' => 'delete',
        'position' => 0,
    ]);
    // Add a second column so the first can be deleted
    $board->columns()->create([
        'name' => 'Keeper',
        'status_key' => 'keeper',
        'position' => 1,
    ]);

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->delete(route('projects.boards.columns.destroy', [$workspace, $project, $board, $column]))
        ->assertRedirect();

    expect(BoardColumn::whereKey($column->id)->exists())->toBeFalse();
});

test('last column cannot be deleted', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $board = Board::factory()->create([
        'project_id' => $project->id,

    ]);
    $column = $board->columns()->create([
        'name' => 'Only Column',
        'status_key' => 'only',
        'position' => 0,
    ]);

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->delete(route('projects.boards.columns.destroy', [$workspace, $project, $board, $column]))
        ->assertRedirect();

    expect(BoardColumn::whereKey($column->id)->exists())->toBeTrue();
});

test('viewers cannot delete columns', function () {
    $viewer = User::factory()->create();
    $workspace = createWorkspaceMember($viewer, 'manager');
    $project = createProjectForWorkspace($workspace, $viewer, 'viewer');
    $board = Board::factory()->create([
        'project_id' => $project->id,

    ]);
    $column = $board->columns()->create([
        'name' => 'Col',
        'status_key' => 'col',
        'position' => 0,
    ]);

    $this->actingAs($viewer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->delete(route('projects.boards.columns.destroy', [$workspace, $project, $board, $column]))
        ->assertForbidden();
});

test('project managers can reorder columns', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $board = Board::factory()->create([
        'project_id' => $project->id,

    ]);
    $col1 = $board->columns()->create(['name' => 'First', 'status_key' => 'first', 'position' => 0]);
    $col2 = $board->columns()->create(['name' => 'Second', 'status_key' => 'second', 'position' => 1]);

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.boards.columns.reorder', [$workspace, $project, $board]), [
            'columns' => [
                ['id' => $col2->id, 'position' => 0],
                ['id' => $col1->id, 'position' => 1],
            ],
        ])
        ->assertRedirect();

    expect($col2->refresh()->position)->toBe(0)
        ->and($col1->refresh()->position)->toBe(1);
});
