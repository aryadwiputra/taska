<?php

use App\Models\User;
use App\Services\WorkspaceRoleService;
use Illuminate\Support\Facades\Http;

test('guests are redirected to login', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');
    $project = createProjectForWorkspace($workspace, $user, 'lead');
    $task = createTaskForProject($project, $user);

    $this->post(route('projects.tasks.comments.typing', [$workspace, $project, $task]))
        ->assertRedirect(route('login'));
});

test('authenticated users can ping typing indicator', function () {
    Http::fake();
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');
    $project = createProjectForWorkspace($workspace, $user, 'lead');
    $task = createTaskForProject($project, $user);

    $this->actingAs($user)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.tasks.comments.typing', [$workspace, $project, $task]))
        ->assertOk();

    Http::assertSent(function ($request) use ($project, $task, $user) {
        $body = $request->data();
        return str_contains($request->url(), '/broadcast')
            && ($body['channel'] ?? '') === "project.{$project->id}"
            && ($body['event'] ?? '') === 'comment.typing';
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
    Http::fake();
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

    $this->actingAs($member)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.tasks.comments.typing', [$workspace, $project, $task]))
        ->assertOk();

    Http::assertSent(function ($request) use ($project, $task, $member) {
        $body = $request->data();
        return str_contains($request->url(), '/broadcast')
            && ($body['channel'] ?? '') === "project.{$project->id}"
            && ($body['event'] ?? '') === 'comment.typing';
    });
});
