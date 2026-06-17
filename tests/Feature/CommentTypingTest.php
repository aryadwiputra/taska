<?php

use App\Events\CommentTyping;
use App\Models\User;
use App\Services\WorkspaceRoleService;
use Illuminate\Support\Facades\Event;

test('guests are redirected to login', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');
    $project = createProjectForWorkspace($workspace, $user, 'lead');
    $task = createTaskForProject($project, $user);

    $this->post(route('projects.tasks.comments.typing', [$workspace, $project, $task]))
        ->assertRedirect(route('login'));
});

test('authenticated users can ping typing indicator', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');
    $project = createProjectForWorkspace($workspace, $user, 'lead');
    $task = createTaskForProject($project, $user);

    Event::fake();

    $this->actingAs($user)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.tasks.comments.typing', [$workspace, $project, $task]))
        ->assertOk();

    Event::assertDispatched(CommentTyping::class, function ($event) use ($project, $task, $user) {
        return $event->projectId === $project->id
            && $event->taskId === $task->id
            && $event->userId === $user->id
            && $event->userName === $user->name;
    });
});

test('non-project members cannot ping typing indicator', function () {
    $owner = User::factory()->create();
    $workspace = createWorkspaceMember($owner, 'owner');
    $project = createProjectForWorkspace($workspace, $owner, 'lead');
    $task = createTaskForProject($project, $owner);

    $nonMember = User::factory()->create();

    $this->actingAs($nonMember)
        ->post(route('projects.tasks.comments.typing', [$workspace, $project, $task]))
        ->assertForbidden();
});

test('project members can ping typing indicator', function () {
    $owner = User::factory()->create();
    $workspace = createWorkspaceMember($owner, 'owner');
    $project = createProjectForWorkspace($workspace, $owner, 'lead');
    $task = createTaskForProject($project, $owner);

    $member = User::factory()->create();
    $workspace->members()->create([
        'user_id' => $member->id,
        'role' => 'member',
        'status' => 'active',
    ]);
    app(WorkspaceRoleService::class)->syncRole($member, $workspace, 'member');
    $project->members()->create([
        'user_id' => $member->id,
        'role' => 'developer',
    ]);

    Event::fake();

    $this->actingAs($member)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.tasks.comments.typing', [$workspace, $project, $task]))
        ->assertOk();

    Event::assertDispatched(CommentTyping::class, function ($event) use ($project, $task, $member) {
        return $event->projectId === $project->id
            && $event->taskId === $task->id
            && $event->userId === $member->id
            && $event->userName === $member->name;
    });
});
