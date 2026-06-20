<?php

use App\Models\AutomationRule;
use App\Models\User;

test('project managers can create automation rules', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.automation.store', [$workspace, $project]), [
            'name' => 'Auto close',
            'trigger_event' => 'task.status_changed',
            'conditions' => [['field' => 'status', 'operator' => 'equals', 'value' => 'done']],
            'actions' => [['type' => 'send_notification', 'value' => 'done']],
            'priority' => 1,
        ])
        ->assertOk();

    expect($project->automationRules()->where('name', 'Auto close')->exists())->toBeTrue();
});

test('it renders automation rules index', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('projects.automation.index', [$workspace, $project]))
        ->assertOk();
});

test('project managers can update automation rules', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');

    $rule = AutomationRule::create([
        'project_id' => $project->id,
        'name' => 'Old rule',
        'trigger_event' => 'task.status_changed',
        'conditions' => [],
        'actions' => [],
        'enabled' => true,
        'priority' => 0,
    ]);

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->put(route('projects.automation.update', [$workspace, $project, $rule]), [
            'name' => 'Updated rule',
            'enabled' => false,
        ])
        ->assertOk();

    expect($rule->refresh()->name)->toBe('Updated rule')
        ->and($rule->enabled)->toBeFalse();
});

test('project managers can delete automation rules', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');

    $rule = AutomationRule::create([
        'project_id' => $project->id,
        'name' => 'Temp rule',
        'trigger_event' => 'task.status_changed',
        'conditions' => [],
        'actions' => [],
        'enabled' => true,
        'priority' => 0,
    ]);

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->delete(route('projects.automation.destroy', [$workspace, $project, $rule]))
        ->assertOk();

    expect(AutomationRule::whereKey($rule->id)->exists())->toBeFalse();
});
