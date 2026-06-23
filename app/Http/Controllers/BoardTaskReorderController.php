<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReorderBoardTasksRequest;
use App\Models\Board;
use App\Models\Project;
use App\Models\Task;
use App\Models\Workspace;
use App\Services\RealtimeGatewayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BoardTaskReorderController extends Controller
{
    public function reorder(ReorderBoardTasksRequest $request, Workspace $workspace, Project $project, Board $board): JsonResponse
    {
        $validated = $request->validated();
        $columnsData = $validated['columns'];
        $columnIds = array_column($columnsData, 'column_id');
        $boardColumns = $board->columns()->whereIn('id', $columnIds)->get()->keyBy('id');

        if ($boardColumns->count() !== count(array_unique($columnIds))) {
            throw ValidationException::withMessages([
                'columns' => 'Every column must belong to the selected board.',
            ]);
        }

        $allTaskIds = [];

        foreach ($columnsData as $colData) {
            $allTaskIds = array_merge($allTaskIds, $colData['task_ids']);
        }

        if (count($allTaskIds) !== count(array_unique($allTaskIds))) {
            throw ValidationException::withMessages([
                'columns' => 'A task may only appear once in the board reorder payload.',
            ]);
        }

        $tasks = $project->tasks()
            ->whereIn('id', $allTaskIds)
            ->where('board_id', $board->id)
            ->get()
            ->keyBy('id');

        if ($tasks->count() !== count(array_unique($allTaskIds))) {
            throw ValidationException::withMessages([
                'columns' => 'Every task must belong to the selected project and board.',
            ]);
        }

        foreach ($columnsData as $colData) {
            $column = $boardColumns->get($colData['column_id']);

            $nonPayloadTaskCount = $project->tasks()
                ->where('board_id', $board->id)
                ->where('board_column_id', $column->id)
                ->whereNotIn('id', $allTaskIds)
                ->count();

            if ($column->wip_limit !== null && count($colData['task_ids']) + $nonPayloadTaskCount > $column->wip_limit) {
                throw ValidationException::withMessages([
                    'columns' => "WIP limit reached for \"{$column->name}\".",
                ]);
            }

            $approvalFlow = $project->approvalFlows()
                ->where('column_id', $column->id)
                ->where('enabled', true)
                ->first();

            if (! $approvalFlow) {
                continue;
            }

            foreach ($colData['task_ids'] as $taskId) {
                $task = $tasks->get($taskId);

                if ((int) $task->board_column_id === (int) $column->id) {
                    continue;
                }

                $approvedCount = $task->approvals()
                    ->where('approval_flow_id', $approvalFlow->id)
                    ->where('status', 'approved')
                    ->count();

                if ($approvedCount < $approvalFlow->min_approvals) {
                    throw ValidationException::withMessages([
                        'columns' => "Approval required to move to \"{$column->name}\".",
                    ]);
                }
            }
        }

        $updatedColumns = DB::transaction(function () use ($allTaskIds, $board, $boardColumns, $columnsData, $project, $tasks) {
            $positionStep = 1000;

            foreach ($columnsData as $colData) {
                $columnId = $colData['column_id'];
                $taskIds = $colData['task_ids'];
                $column = $boardColumns->get($columnId);

                foreach ($taskIds as $index => $taskId) {
                    $task = $tasks->get($taskId);

                    $task->updateQuietly([
                        'board_column_id' => $columnId,
                        'position' => ($index + 1) * $positionStep,
                        'status' => $column->status_key,
                    ]);
                }

                $nonPayloadTasks = Task::query()
                    ->where('project_id', $project->id)
                    ->where('board_id', $board->id)
                    ->where('board_column_id', $columnId)
                    ->whereNotIn('id', $allTaskIds)
                    ->orderBy('position')
                    ->orderBy('id')
                    ->get();

                foreach ($nonPayloadTasks as $index => $task) {
                    $task->updateQuietly([
                        'position' => (count($taskIds) + $index + 1) * $positionStep,
                    ]);
                }
            }

            return $board->columns()
                ->orderBy('position')
                ->get()
                ->map(function ($col) {
                    $sprintId = request()->query('sprint_id');

                    return [
                        'id' => $col->id,
                        'name' => $col->name,
                        'status_key' => $col->status_key,
                        'color' => $col->color,
                        'position' => $col->position,
                        'is_done_column' => $col->is_done_column,
                        'wip_limit' => $col->wip_limit,
                        'task_count' => $col->tasks()
                            ->when($sprintId, fn ($q) => $q->whereHas('sprints', fn ($sq) => $sq->where('sprints.id', $sprintId)))
                            ->count(),
                        'tasks' => $col->tasks()
                            ->when($sprintId, fn ($q) => $q->whereHas('sprints', fn ($sq) => $sq->where('sprints.id', $sprintId)))
                            ->with(['assignees:id,name,avatar', 'priority:id,name,key,level,color', 'taskType:id,name,key,icon,color', 'epics:id,name,color,status', 'sprints:id,name,status,start_date,end_date'])
                            ->orderBy('position')
                            ->get()
                            ->map(fn ($task) => [
                                'id' => $task->id,
                                'task_number' => $task->task_number,
                                'code' => $task->code,
                                'title' => $task->title,
                                'status' => $task->status,
                                'position' => $task->position,
                                'due_date' => $task->due_date,
                                'priority' => $task->priority ? [
                                    'id' => $task->priority->id,
                                    'name' => $task->priority->name,
                                    'key' => $task->priority->key,
                                    'color' => $task->priority->color,
                                ] : null,
                                'task_type' => [
                                    'id' => $task->taskType->id,
                                    'name' => $task->taskType->name,
                                    'key' => $task->taskType->key,
                                    'color' => $task->taskType->color,
                                ],
                                'assignees' => $task->assignees->map(fn ($u) => [
                                    'id' => $u->id,
                                    'name' => $u->name,
                                    'avatar' => $u->avatar,
                                ]),
                                'epics' => $task->epics->map(fn ($epic) => [
                                    'id' => $epic->id,
                                    'name' => $epic->name,
                                    'color' => $epic->color,
                                    'status' => $epic->status,
                                ]),
                                'sprints' => $task->sprints->map(fn ($sprint) => [
                                    'id' => $sprint->id,
                                    'name' => $sprint->name,
                                    'status' => $sprint->status,
                                    'start_date' => $sprint->start_date,
                                    'end_date' => $sprint->end_date,
                                ]),
                            ]),
                    ];
                });
        });

        // Broadcast to other clients
        app(RealtimeGatewayService::class)->broadcast("project.{$project->id}", 'tasks.reordered', ['columns' => $updatedColumns->toArray()]);

        return response()->json([
            'columns' => $updatedColumns,
        ]);
    }
}
