<?php

use App\Mail\GenericNotificationMail;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Mail;

test('task assignment sends email notification via mail channel', function () {
    Mail::fake();

    $reporter = User::factory()->create();
    $assignee = User::factory()->create();
    $workspace = createWorkspaceMember($reporter, 'manager');
    $project = createProjectForWorkspace($workspace, $reporter, 'manager');
    $task = createTaskForProject($project, $reporter);

    app(NotificationService::class)->notifyAssigned($task, $assignee, $reporter);

    Mail::assertSent(GenericNotificationMail::class, function (GenericNotificationMail $mail) use ($assignee) {
        return $mail->hasTo($assignee->email);
    });
});

test('task comment sends email notification via mail channel', function () {
    Mail::fake();

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

    Mail::assertSent(GenericNotificationMail::class, function (GenericNotificationMail $mail) use ($reporter) {
        return $mail->hasTo($reporter->email);
    });
});
