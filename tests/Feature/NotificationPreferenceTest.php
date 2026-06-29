<?php

use App\Models\NotificationPreference;
use App\Models\User;

test('guests are redirected to login', function () {
    $this->get(route('notifications.edit'))
        ->assertRedirect(route('login'));
});

test('authenticated users can view notification preferences', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('notifications.edit'))
        ->assertOk();
});

test('notification preferences page renders with correct props', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->get(route('notifications.edit'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('settings/notifications')
        ->has('preferences')
    );
});

test('authenticated users can update notification preferences', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->put(route('notifications.update'), [
            'preferences' => [
                'task.assigned' => [
                    'in_app_enabled' => true,
                    'email_enabled' => false,
                ],
                'task.commented' => [
                    'in_app_enabled' => false,
                    'email_enabled' => true,
                ],
            ],
        ])
        ->assertRedirect(route('notifications.edit'));

    $this->assertDatabaseHas('notification_preferences', [
        'user_id' => $user->id,
        'type' => 'task.assigned',
        'channel' => 'in_app',
        'enabled' => true,
    ]);

    $this->assertDatabaseHas('notification_preferences', [
        'user_id' => $user->id,
        'type' => 'task.assigned',
        'channel' => 'email',
        'enabled' => false,
    ]);
});

test('notification preferences are updated when they already exist', function () {
    $user = User::factory()->create();

    NotificationPreference::create([
        'user_id' => $user->id,
        'type' => 'task.assigned',
        'channel' => 'in_app',
        'enabled' => true,
    ]);

    $this->actingAs($user)
        ->put(route('notifications.update'), [
            'preferences' => [
                'task.assigned' => [
                    'in_app_enabled' => false,
                    'email_enabled' => false,
                ],
            ],
        ])
        ->assertRedirect(route('notifications.edit'));

    $this->assertDatabaseHas('notification_preferences', [
        'user_id' => $user->id,
        'type' => 'task.assigned',
        'channel' => 'in_app',
        'enabled' => false,
    ]);
});

test('notification preference model checks email enabled correctly', function () {
    $user = User::factory()->create();

    // Default should be true
    expect(NotificationPreference::isEmailEnabled($user, 'task.assigned'))->toBeTrue();

    // Create preference with email disabled
    NotificationPreference::create([
        'user_id' => $user->id,
        'type' => 'task.assigned',
        'channel' => 'email',
        'enabled' => false,
    ]);

    expect(NotificationPreference::isEmailEnabled($user, 'task.assigned'))->toBeFalse();
});

test('notification preference model checks in-app enabled correctly', function () {
    $user = User::factory()->create();

    // Default should be true
    expect(NotificationPreference::isInAppEnabled($user, 'task.assigned'))->toBeTrue();

    // Create preference with in-app disabled
    NotificationPreference::create([
        'user_id' => $user->id,
        'type' => 'task.assigned',
        'channel' => 'in_app',
        'enabled' => false,
    ]);

    expect(NotificationPreference::isInAppEnabled($user, 'task.assigned'))->toBeFalse();
});
