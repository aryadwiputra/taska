<?php

use App\Models\User;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

test('super admin can view admin dashboard', function () {
    $admin = User::factory()->asSuperAdmin()->create();

    actingAs($admin)->withSession(['current_workspace_id' => null])
        ->get(route('admin.dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')
            ->has('stats.totalUsers')
            ->has('stats.totalWorkspaces')
        );
});

test('non-admin cannot view admin dashboard', function () {
    $user = User::factory()->create();

    actingAs($user)
        ->get(route('admin.dashboard'))
        ->assertForbidden();
});

test('guest cannot view admin dashboard', function () {
    get(route('admin.dashboard'))
        ->assertRedirect(route('login'));
});
