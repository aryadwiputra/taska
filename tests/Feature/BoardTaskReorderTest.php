<?php

use App\Models\Priority;
use App\Models\TaskType;
use App\Models\User;
use Illuminate\Support\Facades\Http;

function createBoardTask($project, $reporter, $column, int $position, string $title)
{
    $taskType = $project->workspace->taskTypes()->first()
        ?? TaskType::factory()->create(['workspace_id' => $project->workspace_id]);
    $priority = $project->workspace->priorities()->first()
        ?? Priority::factory()->create(['workspace_id' => $project->workspace_id]);
    $taskNumber = $project->tasks()->withTrashed()->max('task_number') + 1;

    return $project->tasks()->create([
        'board_id' => $column->board_id,
        'board_column_id' => $column->id,
        'task_type_id' => $taskType->id,
        'priority_id' => $priority->id,
        'reporter_id' => $reporter->id,
        'task_number' => $taskNumber,
        'code' => $project->key.'-'.$taskNumber,
        'title' => $title,
        'status' => $column->status_key,
        'position' => $position,
    ]);
}

test('project managers can batch reorder board tasks within a column', function () {
    Http::fake();

    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $board = $project->boards()->where('is_default', true)->first();
    $todo = $board->columns()->where('status_key', 'todo')->first();

    $taskA = createBoardTask($project, $manager, $todo, 1000, 'Task A');
    $taskB = createBoardTask($project, $manager, $todo, 2000, 'Task B');
    $taskC = createBoardTask($project, $manager, $todo, 3000, 'Task C');

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->postJson(route('projects.boards.tasks.reorder', [$workspace, $project, $board]), [
            'columns' => [
                ['column_id' => $todo->id, 'task_ids' => [$taskC->id, $taskA->id, $taskB->id]],
            ],
        ])
        ->assertSuccessful()
        ->assertJsonPath('columns.0.tasks.0.id', $taskC->id);

    expect($taskC->refresh()->position)->toBe('1000.000000')
        ->and($taskA->refresh()->position)->toBe('2000.000000')
        ->and($taskB->refresh()->position)->toBe('3000.000000');

    Http::assertSent(fn ($r) => str_contains($r->url(), '/broadcast') && $r['event'] === 'tasks.reordered');
});

test('project managers can batch move board tasks across columns', function () {
    Http::fake();

    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $board = $project->boards()->where('is_default', true)->first();
    $todo = $board->columns()->where('status_key', 'todo')->first();
    $done = $board->columns()->where('status_key', 'done')->first();

    $taskA = createBoardTask($project, $manager, $todo, 1000, 'Task A');
    $taskB = createBoardTask($project, $manager, $todo, 2000, 'Task B');
    $taskC = createBoardTask($project, $manager, $done, 1000, 'Task C');

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->postJson(route('projects.boards.tasks.reorder', [$workspace, $project, $board]), [
            'columns' => [
                ['column_id' => $todo->id, 'task_ids' => [$taskA->id]],
                ['column_id' => $done->id, 'task_ids' => [$taskB->id, $taskC->id]],
            ],
        ])
        ->assertSuccessful()
        ->assertJsonPath('columns.1.tasks.0.id', $taskB->id);

    $taskB->refresh();
    $taskC->refresh();

    expect($taskB->board_column_id)->toBe($done->id)
        ->and($taskB->status)->toBe($done->status_key)
        ->and($taskB->position)->toBe('1000.000000')
        ->and($taskC->position)->toBe('2000.000000');

    Http::assertSent(fn ($r) => str_contains($r->url(), '/broadcast') && $r['event'] === 'tasks.reordered');
});

test('project managers can move the only task out of a column', function () {
    Http::fake();

    $manager = User::factory()->create();
    $workspace = createWorkspaceMember($manager, 'manager');
    $project = createProjectForWorkspace($workspace, $manager, 'manager');
    $board = $project->boards()->where('is_default', true)->first();
    $todo = $board->columns()->where('status_key', 'todo')->first();
    $done = $board->columns()->where('status_key', 'done')->first();

    $task = createBoardTask($project, $manager, $todo, 1000, 'Only Todo Task');

    $this->actingAs($manager)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->postJson(route('projects.boards.tasks.reorder', [$workspace, $project, $board]), [
            'columns' => [
                ['column_id' => $todo->id, 'task_ids' => []],
                ['column_id' => $done->id, 'task_ids' => [$task->id]],
            ],
        ])
        ->assertSuccessful()
        ->assertJsonPath('columns.0.tasks', [])
        ->assertJsonPath('columns.1.tasks.0.id', $task->id);

    $task->refresh();

    expect($task->board_column_id)->toBe($done->id)
        ->and($task->status)->toBe($done->status_key)
        ->and($task->position)->toBe('1000.000000');

    Http::assertSent(fn ($r) => str_contains($r->url(), '/broadcast') && $r['event'] === 'tasks.reordered');
});
