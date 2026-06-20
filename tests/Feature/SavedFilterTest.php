<?php

use App\Models\SavedFilter;
use App\Models\User;

test('it renders saved filters page', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('projects.saved-filters.index', [$workspace, $project]))
        ->assertOk();
});

test('project managers can create saved filters', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');

    SavedFilter::query()->delete();

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.saved-filters.store', [$workspace, $project]), [
            'name' => 'My bugs',
            'filters' => ['status' => 'todo'],
            'sort_field' => 'priority',
            'sort_direction' => 'desc',
        ])
        ->assertCreated();

    expect(SavedFilter::where('name', 'My bugs')->exists())->toBeTrue()
        ->and(SavedFilter::first()->user_id)->toBe($manager->id);
});

test('project managers can delete their own saved filters', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');

    $filter = SavedFilter::create([
        'project_id' => $project->id,
        'user_id' => $manager->id,
        'name' => 'Temp filter',
        'filters' => [],
        'sort_field' => 'position',
        'sort_direction' => 'asc',
    ]);

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->delete(route('projects.saved-filters.destroy', [$workspace, $project, $filter]))
        ->assertOk();

    expect(SavedFilter::whereKey($filter->id)->exists())->toBeFalse();
});

test('project viewers cannot create saved filters', function () {
    $viewer = User::factory()->create();
    $workspace = createWorkspaceMember($viewer, 'manager');
    $project = createProjectForWorkspace($workspace, $viewer, 'viewer');

    SavedFilter::query()->delete();

    $this->actingAs($viewer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.saved-filters.store', [$workspace, $project]), [
            'name' => 'Filter',
            'filters' => [],
        ])
        ->assertForbidden();
});

test('it returns filters scoped to user and shared', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');

    SavedFilter::create([
        'project_id' => $project->id,
        'user_id' => $manager->id,
        'name' => 'My filter',
        'filters' => [],
        'sort_field' => 'position',
        'sort_direction' => 'asc',
        'is_shared' => false,
    ]);

    SavedFilter::create([
        'project_id' => $project->id,
        'user_id' => User::factory()->create()->id,
        'name' => 'Shared filter',
        'filters' => [],
        'sort_field' => 'position',
        'sort_direction' => 'asc',
        'is_shared' => true,
    ]);

    SavedFilter::create([
        'project_id' => $project->id,
        'user_id' => User::factory()->create()->id,
        'name' => 'Other user filter',
        'filters' => [],
        'sort_field' => 'position',
        'sort_direction' => 'asc',
        'is_shared' => false,
    ]);

    $response = $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('projects.saved-filters.index', [$workspace, $project]))
        ->assertOk();

    $data = $response->json('saved_filters');

    expect(collect($data)->count())->toBe(2)
        ->and(collect($data)->pluck('name')->contains('My filter'))->toBeTrue()
        ->and(collect($data)->pluck('name')->contains('Shared filter'))->toBeTrue()
        ->and(collect($data)->pluck('name')->contains('Other user filter'))->toBeFalse();
});
