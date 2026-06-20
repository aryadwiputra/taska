<?php

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Str;

test('users can view their notifications', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');
    Notification::create([
        'id' => (string) Str::uuid(),
        'user_id' => $user->id,
        'type' => 'task_assigned',
        'title' => 'Task assigned',
        'workspace_id' => $workspace->id,
    ]);

    $this->actingAs($user)->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('my-notifications.index'))
        ->assertSuccessful();
});

test('users can mark their own notifications as read', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');
    $notification = Notification::create([
        'id' => (string) Str::uuid(),
        'user_id' => $user->id,
        'type' => 'task_assigned',
        'title' => 'Task assigned',
        'workspace_id' => $workspace->id,
    ]);

    $this->actingAs($user)->withSession(['current_workspace_id' => $workspace->id])
        ->patch(route('my-notifications.read', $notification))
        ->assertRedirect();

    expect($notification->fresh()->read_at)->not->toBeNull();
});

test('users cannot modify other users notifications', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');
    $notification = Notification::create([
        'id' => (string) Str::uuid(),
        'user_id' => $other->id,
        'type' => 'task_assigned',
        'title' => 'Task assigned',
    ]);

    $this->actingAs($user)->withSession(['current_workspace_id' => $workspace->id])
        ->patch(route('my-notifications.read', $notification))
        ->assertForbidden();
});

test('users can mark all notifications as read', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');
    Notification::create(['id' => (string) Str::uuid(), 'user_id' => $user->id, 'type' => 'alert', 'title' => 'A', 'workspace_id' => $workspace->id]);
    Notification::create(['id' => (string) Str::uuid(), 'user_id' => $user->id, 'type' => 'alert', 'title' => 'B', 'workspace_id' => $workspace->id]);

    $this->actingAs($user)->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('my-notifications.read-all'))
        ->assertRedirect();

    expect($user->notifications()->unread()->count())->toBe(0);
});

test('users can delete their own notifications', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');
    $notification = Notification::create([
        'id' => (string) Str::uuid(),
        'user_id' => $user->id,
        'type' => 'task_assigned',
        'title' => 'Task assigned',
        'workspace_id' => $workspace->id,
    ]);

    $this->actingAs($user)->withSession(['current_workspace_id' => $workspace->id])
        ->delete(route('my-notifications.destroy', $notification))
        ->assertRedirect();

    expect(Notification::whereKey($notification->id)->exists())->toBeFalse();
});

test('users cannot delete other users notifications', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');
    $notification = Notification::create([
        'id' => (string) Str::uuid(),
        'user_id' => $other->id,
        'type' => 'task_assigned',
        'title' => 'Task assigned',
    ]);

    $this->actingAs($user)->withSession(['current_workspace_id' => $workspace->id])
        ->delete(route('my-notifications.destroy', $notification))
        ->assertForbidden();
});

test('notifications index has paginated results and unread count', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');
    Notification::create(['id' => (string) Str::uuid(), 'user_id' => $user->id, 'type' => 'alert', 'title' => 'Unread', 'workspace_id' => $workspace->id]);
    Notification::create(['id' => (string) Str::uuid(), 'user_id' => $user->id, 'type' => 'alert', 'title' => 'Read', 'read_at' => now(), 'workspace_id' => $workspace->id]);

    $this->actingAs($user)->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('my-notifications.index'))
        ->assertInertia(fn ($page) => $page
            ->component('notifications/index')
            ->has('notifications.data', 2)
            ->has('unreadCount')
        );
});
