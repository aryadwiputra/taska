<?php

use App\Models\User;
use App\Models\WorkspaceInvitation;
use App\Services\MailjetService;
use Illuminate\Support\Str;

test('workspace owner can invite user by email', function () {
    $mailjet = Mockery::mock(MailjetService::class);
    $mailjet->shouldReceive('send')
        ->once()
        ->with('new@example.com', null, Mockery::type('string'), Mockery::type('string'));
    $this->app->instance(MailjetService::class, $mailjet);

    $owner = User::factory()->create();
    $workspace = createWorkspaceMember($owner, 'owner');

    $this->actingAs($owner)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('workspaces.invitations.store', $workspace), [
            'email' => 'new@example.com',
            'role' => 'member',
        ])
        ->assertRedirect();

    $invitation = WorkspaceInvitation::where('email', 'new@example.com')->first();

    expect($invitation)->not->toBeNull()
        ->and($invitation->workspace_id)->toBe($workspace->id)
        ->and($invitation->role)->toBe('member')
        ->and($invitation->token)->not->toBeEmpty();
});

test('workspace owner cannot invite an existing member', function () {
    $mailjet = Mockery::mock(MailjetService::class);
    $mailjet->shouldReceive('send')->never();
    $this->app->instance(MailjetService::class, $mailjet);

    $owner = User::factory()->create();
    $member = User::factory()->create(['email' => 'member@example.com']);
    $workspace = createWorkspaceMember($owner, 'owner');
    $workspace->members()->create([
        'user_id' => $member->id,
        'role' => 'member',
        'status' => 'active',
    ]);

    $this->actingAs($owner)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('workspaces.invitations.store', $workspace), [
            'email' => 'member@example.com',
            'role' => 'member',
        ])
        ->assertRedirect();

    expect(WorkspaceInvitation::where('email', 'member@example.com')->exists())->toBeFalse();
});

test('invited user can accept workspace invitation', function () {
    $owner = User::factory()->create();
    $invited = User::factory()->create(['email' => 'invited@example.com']);
    $workspace = createWorkspaceMember($owner, 'owner');
    $invitation = WorkspaceInvitation::create([
        'workspace_id' => $workspace->id,
        'email' => 'invited@example.com',
        'role' => 'manager',
        'token' => Str::random(64),
        'invited_by' => $owner->id,
        'expired_at' => now()->addDay(),
    ]);

    $this->actingAs($invited)
        ->get(route('workspace-invitations.accept', ['invitation' => $invitation->token]))
        ->assertRedirect(route('workspaces.settings', $workspace));

    expect($workspace->members()->where('user_id', $invited->id)->where('role', 'manager')->exists())->toBeTrue()
        ->and($invitation->refresh()->accepted_at)->not->toBeNull();
});

test('invitation cannot be accepted by a different email address', function () {
    $owner = User::factory()->create();
    $wrongUser = User::factory()->create(['email' => 'wrong@example.com']);
    $workspace = createWorkspaceMember($owner, 'owner');
    $invitation = WorkspaceInvitation::create([
        'workspace_id' => $workspace->id,
        'email' => 'invited@example.com',
        'role' => 'member',
        'token' => Str::random(64),
        'invited_by' => $owner->id,
        'expired_at' => now()->addDay(),
    ]);

    $this->actingAs($wrongUser)
        ->get(route('workspace-invitations.accept', ['invitation' => $invitation->token]))
        ->assertForbidden();
});

test('workspace owner can cancel pending invitation', function () {
    $owner = User::factory()->create();
    $workspace = createWorkspaceMember($owner, 'owner');
    $invitation = WorkspaceInvitation::create([
        'workspace_id' => $workspace->id,
        'email' => 'pending@example.com',
        'role' => 'viewer',
        'token' => Str::random(64),
        'invited_by' => $owner->id,
        'expired_at' => now()->addDay(),
    ]);

    $this->actingAs($owner)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->delete(route('workspaces.invitations.destroy', [$workspace, $invitation]))
        ->assertRedirect();

    expect(WorkspaceInvitation::find($invitation->id))->toBeNull();
});
