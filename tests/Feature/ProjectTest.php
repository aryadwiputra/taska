<?php

use App\Models\Project;
use App\Models\User;

test('workspace managers can create projects', function () {
    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.store', $workspace), [
            'name' => 'Mobile App',
            'key' => 'MOB',
            'slug' => 'mobile-app',
            'description' => 'Mobile work.',
            'visibility' => 'private',
            'color' => '#2563EB',
        ])
        ->assertRedirect();

    expect(Project::where('slug', 'mobile-app')->exists())->toBeTrue();
});

test('workspace members cannot create projects', function () {
    $member = User::factory()->create();
    $workspace = createWorkspaceMember($member, 'member');

    $this->actingAs($member)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->post(route('projects.store', $workspace), [
            'name' => 'Blocked Project',
            'key' => 'BLK',
            'slug' => 'blocked-project',
        ])
        ->assertForbidden();
});

test('updating a project slug redirects to the settings page with the new slug', function () {
    $lead = User::factory()->create();
    $workspace = createWorkspaceMember($lead, 'manager');
    $project = createProjectForWorkspace($workspace, $lead, 'lead');

    $this->actingAs($lead)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->put(route('projects.update', [$workspace, $project]), [
            'name' => 'Renamed project',
            'key' => 'REN',
            'slug' => 'renamed-project',
            'visibility' => 'workspace',
        ])
        ->assertRedirect(route('projects.settings', [
            'workspace' => $workspace->slug,
            'project' => 'renamed-project',
        ]));

    expect($project->fresh()->slug)->toBe('renamed-project');
});
