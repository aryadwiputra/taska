<?php

use App\Models\User;
use App\Services\MentionNotificationService;
use App\Services\NotificationService;
use App\Services\WorkspaceRoleService;
use Illuminate\Support\Facades\Http;

test('notifyAssigned broadcasts via realtime gateway', function () {
    Http::fake();
    $assigner = User::factory()->create();
    $assignee = User::factory()->create();
    $workspace = createWorkspaceMember($assigner, 'manager');
    $workspace->members()->create([
        'user_id' => $assignee->id,
        'role' => 'member',
        'status' => 'active',
    ]);
    app(WorkspaceRoleService::class)->syncRole($assignee, $workspace, 'member');
    $project = createProjectForWorkspace($workspace, $assigner, 'manager');
    $project->members()->create([
        'user_id' => $assignee->id,
        'role' => 'developer',
    ]);
    $task = createTaskForProject($project, $assigner);

    $service = app(NotificationService::class);
    $service->notifyAssigned($task, $assignee, $assigner);

    Http::assertSent(function ($request) use ($assignee, $task) {
        $body = $request->data();
        return str_contains($request->url(), '/broadcast')
            && ($body['channel'] ?? '') === "user.{$assignee->id}"
            && ($body['event'] ?? '') === 'notification'
            && ($body['data']['type'] ?? '') === 'task.assigned'
            && ($body['data']['task_code'] ?? '') === $task->code;
    });
});

test('notifyComment broadcasts via realtime gateway', function () {
    Http::fake();
    $commenter = User::factory()->create();
    $assignee = User::factory()->create();
    $workspace = createWorkspaceMember($commenter, 'manager');
    $workspace->members()->create([
        'user_id' => $assignee->id,
        'role' => 'member',
        'status' => 'active',
    ]);
    app(WorkspaceRoleService::class)->syncRole($assignee, $workspace, 'member');
    $project = createProjectForWorkspace($workspace, $commenter, 'manager');
    $project->members()->create([
        'user_id' => $assignee->id,
        'role' => 'developer',
    ]);
    $task = createTaskForProject($project, $commenter);
    $task->assignees()->attach($assignee);
    $comment = $task->comments()->create([
        'user_id' => $commenter->id,
        'body' => 'Test comment',
    ]);

    $service = app(NotificationService::class);
    $service->notifyComment($task, $commenter, $comment);

    Http::assertSent(function ($request) use ($assignee, $task) {
        $body = $request->data();
        return str_contains($request->url(), '/broadcast')
            && ($body['channel'] ?? '') === "user.{$assignee->id}"
            && ($body['event'] ?? '') === 'notification';
    });
});

test('notifyWatchers broadcasts via realtime gateway', function () {
    Http::fake();
    $actor = User::factory()->create();
    $watcher = User::factory()->create();
    $workspace = createWorkspaceMember($actor, 'manager');
    $workspace->members()->create([
        'user_id' => $watcher->id,
        'role' => 'member',
        'status' => 'active',
    ]);
    app(WorkspaceRoleService::class)->syncRole($watcher, $workspace, 'member');
    $project = createProjectForWorkspace($workspace, $actor, 'manager');
    $project->members()->create([
        'user_id' => $watcher->id,
        'role' => 'developer',
    ]);
    $task = createTaskForProject($project, $actor);
    $task->watchers()->attach($watcher);

    $service = app(NotificationService::class);
    $service->notifyWatchers($task, $actor, collect([$watcher]));

    Http::assertSent(function ($request) use ($watcher, $task) {
        $body = $request->data();
        return str_contains($request->url(), '/broadcast')
            && ($body['channel'] ?? '') === "user.{$watcher->id}"
            && ($body['event'] ?? '') === 'notification'
            && ($body['data']['task_code'] ?? '') === $task->code;
    });
});

test('mention broadcasts via realtime gateway', function () {
    Http::fake();
    $commenter = User::factory()->create();
    $mentioned = User::factory()->create();
    $workspace = createWorkspaceMember($commenter, 'manager');
    $workspace->members()->create([
        'user_id' => $mentioned->id,
        'role' => 'member',
        'status' => 'active',
    ]);
    app(WorkspaceRoleService::class)->syncRole($mentioned, $workspace, 'member');
    $project = createProjectForWorkspace($workspace, $commenter, 'manager');
    $project->members()->create([
        'user_id' => $mentioned->id,
        'role' => 'developer',
    ]);
    $task = createTaskForProject($project, $commenter);
    $comment = $task->comments()->create([
        'user_id' => $commenter->id,
        'body' => 'Hello @'.$mentioned->name,
    ]);

    $service = app(MentionNotificationService::class);
    $service->notify($comment, $task, $commenter, collect([$mentioned]));

    Http::assertSent(function ($request) use ($mentioned, $task) {
        $body = $request->data();
        return str_contains($request->url(), '/broadcast')
            && ($body['channel'] ?? '') === "user.{$mentioned->id}"
            && ($body['event'] ?? '') === 'notification'
            && ($body['data']['task_code'] ?? '') === $task->code;
    });
});
