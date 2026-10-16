<?php

use App\Models\Project;
use App\Models\User;
use App\Models\Workspace;
use App\Services\SettingService;
use Database\Seeders\DatabaseSeeder;

test('seeds a single superadmin user and the personal projects', function () {
    $this->seed(DatabaseSeeder::class);

    expect(User::count())->toBe(1);

    $user = User::sole();
    expect($user->email)->toBe('superadmin@taska.web.id')
        ->and($user->is_super_admin)->toBeTrue();

    $workspace = Workspace::sole();
    expect($workspace->name)->toBe('Pribadi')
        ->and($workspace->slug)->toBe('pribadi')
        ->and($workspace->owner_id)->toBe($user->id);

    expect($workspace->taskTypes()->count())->toBe(5)
        ->and($workspace->priorities()->count())->toBe(6);

    $projects = Project::orderBy('key')->get();
    expect($projects->pluck('key')->all())->toBe(['HATTI', 'KMVG', 'TIBS'])
        ->and($projects->pluck('slug')->all())->toBe(['hatti', 'komodo-voyage', 'taruna-insani']);
});

test('gives every seeded project a board, columns, member and settings', function () {
    $this->seed(DatabaseSeeder::class);

    $user = User::sole();

    foreach (Project::all() as $project) {
        $board = $project->boards()->where('is_default', true)->sole();
        expect($board->columns()->count())->toBe(5)
            ->and($board->columns()->where('is_done_column', true)->count())->toBe(1);

        expect($project->members()->where('user_id', $user->id)->count())->toBe(1);

        $settings = app(SettingService::class);
        expect($settings->get($project, 'default_board_id'))->toBe($board->id)
            ->and($settings->get($project, 'auto_assign_reporter'))->toBeFalse();

        expect($project->docs()->count())->toBe(3);
    }
});
