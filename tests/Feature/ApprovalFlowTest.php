<?php

use App\Models\ApprovalFlow;
use App\Models\User;
use App\Services\WorkspaceRoleService;

test('project managers can create approval flows', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $board = $project->boards()->where('is_default', true)->first();
    $column = $board->columns()->first();

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.approvals.store', [$workspace, $project]), [
            'name' => 'QA Review',
            'column_id' => $column->id,
            'required_approvers' => [
                ['type' => 'role', 'value' => 'qa'],
            ],
            'min_approvals' => 1,
        ])
        ->assertOk();

    expect($project->approvalFlows()->where('name', 'QA Review')->exists())->toBeTrue();
});

test('it renders approval flows index', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('projects.approvals.index', [$workspace, $project]))
        ->assertOk();
});

test('project managers can update approval flows', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $board = $project->boards()->where('is_default', true)->first();
    $column = $board->columns()->first();

    $flow = ApprovalFlow::create([
        'project_id' => $project->id,
        'name' => 'Old Review',
        'column_id' => $column->id,
        'required_approvers' => [['type' => 'role', 'value' => 'qa']],
        'min_approvals' => 1,
        'enabled' => true,
    ]);

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->put(route('projects.approvals.update', [$workspace, $project, $flow]), [
            'name' => 'Updated Review',
            'enabled' => false,
        ])
        ->assertOk();

    expect($flow->refresh()->name)->toBe('Updated Review')
        ->and($flow->enabled)->toBeFalse();
});

test('project managers can delete approval flows', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $board = $project->boards()->where('is_default', true)->first();
    $column = $board->columns()->first();

    $flow = ApprovalFlow::create([
        'project_id' => $project->id,
        'name' => 'Temp Review',
        'column_id' => $column->id,
        'required_approvers' => [['type' => 'role', 'value' => 'qa']],
        'min_approvals' => 1,
        'enabled' => true,
    ]);

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->delete(route('projects.approvals.destroy', [$workspace, $project, $flow]))
        ->assertOk();

    expect(ApprovalFlow::whereKey($flow->id)->exists())->toBeFalse();
});

test('users can approve tasks assigned to them as approver', function () {
    $manager = User::factory()->create();
    $approver = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $board = $project->boards()->where('is_default', true)->first();
    $column = $board->columns()->first();
    $task = createTaskForProject($project, $manager);

    $workspace->members()->create([
        'user_id' => $approver->id,
        'role' => 'member',
        'status' => 'active',
    ]);
    app(WorkspaceRoleService::class)->syncRole($approver, $workspace, 'member');

    $project->members()->create([
        'user_id' => $approver->id,
        'role' => 'member',
    ]);

    $flow = ApprovalFlow::create([
        'project_id' => $project->id,
        'name' => 'QA Review',
        'column_id' => $column->id,
        'required_approvers' => [['type' => 'user', 'value' => "user:{$approver->id}"]],
        'min_approvals' => 1,
        'enabled' => true,
    ]);

    $task->approvals()->create([
        'approval_flow_id' => $flow->id,
        'approver_id' => $approver->id,
        'status' => 'pending',
    ]);

    $this->actingAs($approver)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.tasks.approve', [$workspace, $project, $task]), [
            'comment' => 'Looks good',
        ])
        ->assertOk();

    expect($task->approvals()->where('approver_id', $approver->id)->first()->status)->toBe('approved');
});

test('users can reject tasks assigned to them as approver', function () {
    $manager = User::factory()->create();
    $approver = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $task = createTaskForProject($project, $manager);
    $board = $project->boards()->where('is_default', true)->first();
    $column = $board->columns()->first();

    $workspace->members()->create([
        'user_id' => $approver->id,
        'role' => 'member',
        'status' => 'active',
    ]);
    app(WorkspaceRoleService::class)->syncRole($approver, $workspace, 'member');

    $project->members()->create([
        'user_id' => $approver->id,
        'role' => 'member',
    ]);

    $flow = ApprovalFlow::create([
        'project_id' => $project->id,
        'name' => 'QA Review',
        'column_id' => $column->id,
        'required_approvers' => [['type' => 'user', 'value' => "user:{$approver->id}"]],
        'min_approvals' => 1,
        'enabled' => true,
    ]);

    $task->approvals()->create([
        'approval_flow_id' => $flow->id,
        'approver_id' => $approver->id,
        'status' => 'pending',
    ]);

    $this->actingAs($approver)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.tasks.reject', [$workspace, $project, $task]), [
            'comment' => 'Needs more work',
        ])
        ->assertOk();

    expect($task->approvals()->where('approver_id', $approver->id)->first()->status)->toBe('rejected');
});
