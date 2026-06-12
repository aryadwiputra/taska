<?php

use App\Models\Notification;
use App\Models\User;
use App\Services\WorkspaceRoleService;

test('project members can comment on tasks', function () {
    $member = User::factory()->create();
    $workspace = createWorkspaceMember($member, 'member');
    $project = createProjectForWorkspace($workspace, $member, 'member');
    $task = createTaskForProject($project, $member);

    $this->actingAs($member)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.tasks.comments.store', [$workspace, $project, $task]), [
            'body' => 'Looks good.',
        ])
        ->assertRedirect();

    expect($task->comments()->where('body', 'Looks good.')->exists())->toBeTrue();
});

test('project viewers cannot comment on tasks', function () {
    $viewer = User::factory()->create();
    $workspace = createWorkspaceMember($viewer, 'viewer');
    $project = createProjectForWorkspace($workspace, $viewer, 'viewer');
    $task = createTaskForProject($project, $viewer);

    $this->actingAs($viewer)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.tasks.comments.store', [$workspace, $project, $task]), [
            'body' => 'Blocked.',
        ])
        ->assertForbidden();
});

test('comment authors can edit their comments', function () {
    $member = User::factory()->create();
    $workspace = createWorkspaceMember($member, 'member');
    $project = createProjectForWorkspace($workspace, $member, 'member');
    $task = createTaskForProject($project, $member);
    $comment = $task->comments()->create([
        'user_id' => $member->id,
        'body' => 'Initial body',
    ]);

    $this->actingAs($member)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->patch(route('projects.tasks.comments.update', [$workspace, $project, $task, $comment]), [
            'body' => 'Updated body',
        ])
        ->assertRedirect();

    expect($comment->refresh()->body)->toBe('Updated body')
        ->and($comment->edited_at)->not->toBeNull();
});

test('comments log activity and notify task reporter', function () {
    $reporter = User::factory()->create();
    $commenter = User::factory()->create();
    $workspace = createWorkspaceMember($reporter, 'manager');
    $workspace->members()->create([
        'user_id' => $commenter->id,
        'role' => 'member',
        'status' => 'active',
    ]);
    app(WorkspaceRoleService::class)->syncRole($commenter, $workspace, 'member');
    $project = createProjectForWorkspace($workspace, $reporter, 'manager');
    $project->members()->create([
        'user_id' => $commenter->id,
        'role' => 'member',
    ]);
    $task = createTaskForProject($project, $reporter);

    $this->actingAs($commenter)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.tasks.comments.store', [$workspace, $project, $task]), [
            'body' => 'Please review.',
        ])
        ->assertRedirect();

    expect($task->activities()->where('action', 'commented')->exists())->toBeTrue()
        ->and(Notification::where('user_id', $reporter->id)->where('type', 'task.commented')->exists())->toBeTrue();
});
