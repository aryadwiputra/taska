<?php

use App\Models\SlaPolicy;
use App\Models\User;

test('project managers can manage SLA policies', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $taskType = $workspace->taskTypes()->first();

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.sla-policies.store', [$workspace, $project]), [
            'task_type_id' => $taskType->id,
            'response_hours' => 4,
            'resolution_hours' => 24,
        ])
        ->assertRedirect();

    $policy = $project->slaPolicies()->where('task_type_id', $taskType->id)->first();
    expect($policy)->not->toBeNull()
        ->and($policy->response_hours)->toBe(4)
        ->and($policy->resolution_hours)->toBe(24);

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->put(route('projects.sla-policies.update', [$workspace, $project, $policy]), [
            'response_hours' => 2,
            'resolution_hours' => 12,
            'enabled' => false,
        ])
        ->assertRedirect();

    $policy->refresh();
    expect($policy->response_hours)->toBe(2)
        ->and($policy->resolution_hours)->toBe(12)
        ->and($policy->enabled)->toBeFalse();

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->delete(route('projects.sla-policies.destroy', [$workspace, $project, $policy]))
        ->assertRedirect();

    expect(SlaPolicy::whereKey($policy->id)->exists())->toBeFalse();
});

test('project viewers cannot manage SLA policies', function () {
    $viewer = User::factory()->create();
    $workspace = createWorkspaceMember($viewer, 'manager');
    $project = createProjectForWorkspace($workspace, $viewer, 'viewer');
    $taskType = $workspace->taskTypes()->first();

    $this->actingAs($viewer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.sla-policies.store', [$workspace, $project]), [
            'task_type_id' => $taskType->id,
            'response_hours' => 4,
            'resolution_hours' => 24,
        ])
        ->assertForbidden();
});

test('project members can view SLA settings page', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('projects.sla-policies.index', [$workspace, $project]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('projects/settings/sla'));
});
