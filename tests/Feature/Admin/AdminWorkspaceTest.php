<?php

use App\Models\User;

use function Pest\Laravel\actingAs;

test('super admin can list workspaces', function () {
    $admin = User::factory()->asSuperAdmin()->create();
    $workspace = createWorkspaceMember(User::factory()->create(), 'owner');

    actingAs($admin)
        ->get(route('admin.workspaces.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('admin/workspaces/index'));
});

test('super admin can view workspace details', function () {
    $admin = User::factory()->asSuperAdmin()->create();
    $owner = User::factory()->create();
    $workspace = createWorkspaceMember($owner, 'owner');

    actingAs($admin)
        ->get(route('admin.workspaces.show', $workspace))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/workspaces/show')
            ->has('workspace')
            ->has('members')
        );
});

test('non-admin cannot list workspaces', function () {
    $user = User::factory()->create();

    actingAs($user)
        ->get(route('admin.workspaces.index'))
        ->assertForbidden();
});
