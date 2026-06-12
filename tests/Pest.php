<?php

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\Workspace;
use App\Services\WorkspaceRoleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function something()
{
    // ..
}

function createWorkspaceMember(User $user, string $role = 'owner'): Workspace
{
    $workspace = Workspace::factory()->create([
        'owner_id' => $role === 'owner' ? $user->id : User::factory()->create()->id,
    ]);

    $workspace->members()->create([
        'user_id' => $user->id,
        'role' => $role,
        'status' => 'active',
    ]);

    app(WorkspaceRoleService::class)->syncRole($user, $workspace, $role);

    return $workspace;
}

function createProjectForWorkspace(Workspace $workspace, User $user, string $role = 'lead'): Project
{
    $project = Project::factory()->create([
        'workspace_id' => $workspace->id,
        'created_by' => $user->id,
    ]);

    $project->members()->create([
        'user_id' => $user->id,
        'role' => $role,
    ]);

    $board = $project->boards()->create([
        'name' => 'Board',
        'type' => 'kanban',
        'is_default' => true,
    ]);

    foreach ([
        ['name' => 'Todo', 'status_key' => 'todo', 'color' => '#475569', 'position' => 0],
        ['name' => 'Done', 'status_key' => 'done', 'color' => '#16A34A', 'position' => 1, 'is_done_column' => true],
    ] as $column) {
        $board->columns()->create($column);
    }

    return $project;
}

function createTaskForProject(Project $project, User $reporter): Task
{
    $board = $project->boards()->where('is_default', true)->first();
    $column = $board->columns()->orderBy('position')->first();
    $taskType = $project->workspace->taskTypes()->first();
    $priority = $project->workspace->priorities()->first();
    $taskNumber = $project->tasks()->withTrashed()->max('task_number') + 1;

    return $project->tasks()->create([
        'board_id' => $board->id,
        'board_column_id' => $column->id,
        'task_type_id' => $taskType->id,
        'priority_id' => $priority->id,
        'reporter_id' => $reporter->id,
        'task_number' => $taskNumber,
        'code' => $project->key.'-'.$taskNumber,
        'title' => 'Test task',
        'status' => $column->status_key,
        'position' => 0,
    ]);
}
