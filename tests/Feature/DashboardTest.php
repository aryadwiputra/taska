<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users without workspace are redirected to create workspace', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->get(route('dashboard'))
        ->assertRedirect(route('workspaces.create'));
});

test('authenticated users with workspace can visit the dashboard', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');
    $this->actingAs($user)->withSession(['current_workspace_id' => $workspace->id]);

    $this->get(route('dashboard'))
        ->assertOk();
});
