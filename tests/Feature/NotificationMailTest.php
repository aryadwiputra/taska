<?php

use App\Models\User;
use App\Services\MailjetService;
use App\Services\NotificationService;

test('task assignment sends email notification via mail channel', function () {
    $mj = Mockery::mock(MailjetService::class);
    $mj->shouldReceive('send')
        ->once()
        ->withArgs(fn ($email) => $email !== null)
        ->andReturnTrue();
    $this->app->instance(MailjetService::class, $mj);

    $reporter = User::factory()->create();
    $assignee = User::factory()->create();
    $workspace = createWorkspaceMember($reporter, 'manager');
    $project = createProjectForWorkspace($workspace, $reporter, 'manager');
    $task = createTaskForProject($project, $reporter);

    app(NotificationService::class)->notifyAssigned($task, $assignee, $reporter);
});

test('task comment sends email notification via mail channel', function () {
    $mj = Mockery::mock(MailjetService::class);
    $mj->shouldReceive('send')
        ->once()
        ->withArgs(fn ($email) => $email !== null)
        ->andReturnTrue();
    $this->app->instance(MailjetService::class, $mj);

    $reporter = User::factory()->create();
    $commenter = User::factory()->create();
    $workspace = createWorkspaceMember($reporter, 'manager');
    $project = createProjectForWorkspace($workspace, $reporter, 'manager');
    $task = createTaskForProject($project, $reporter);
    $comment = $task->comments()->create([
        'user_id' => $commenter->id,
        'body' => 'Please review this update.',
    ]);

    app(NotificationService::class)->notifyComment($task, $commenter, $comment);
});
