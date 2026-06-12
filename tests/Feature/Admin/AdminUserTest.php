<?php

use App\Models\User;

use function Pest\Laravel\actingAs;

test('super admin can list users', function () {
    $admin = User::factory()->asSuperAdmin()->create();
    User::factory()->count(3)->create();

    actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('admin/users/index'));
});

test('super admin can create a user', function () {
    $admin = User::factory()->asSuperAdmin()->create();

    actingAs($admin)
        ->post(route('admin.users.store'), [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => 'password123',
        ])
        ->assertRedirect(route('admin.users.index'));

    expect(User::where('email', 'newuser@example.com')->exists())->toBeTrue();
});

test('super admin can create a super admin user', function () {
    $admin = User::factory()->asSuperAdmin()->create();

    actingAs($admin)
        ->post(route('admin.users.store'), [
            'name' => 'Another Admin',
            'email' => 'another-admin@example.com',
            'password' => 'password123',
            'is_super_admin' => true,
        ])
        ->assertRedirect();

    $created = User::where('email', 'another-admin@example.com')->first();

    expect($created->is_super_admin)->toBeTrue();
});

test('super admin cannot delete their own account', function () {
    $admin = User::factory()->asSuperAdmin()->create();

    actingAs($admin)
        ->delete(route('admin.users.destroy', $admin))
        ->assertSessionHasNoErrors();

    expect(User::find($admin->id))->not->toBeNull();
});

test('non-admin cannot access user management', function () {
    $user = User::factory()->create();

    actingAs($user)
        ->get(route('admin.users.index'))
        ->assertForbidden();
});
