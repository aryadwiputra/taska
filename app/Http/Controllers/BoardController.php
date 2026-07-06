<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBoardRequest;
use App\Http\Requests\UpdateBoardRequest;
use App\Models\Board;
use App\Models\Project;
use App\Models\Workspace;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class BoardController extends Controller
{
    public function show(Workspace $workspace, Project $project, Request $request): Response
    {
        $boardId = $request->query('board_id');
        $board = $boardId
            ? $project->boards()->findOrFail($boardId)
            : $project->boards()->where('is_default', true)->firstOrFail();

        Gate::authorize('view', $board);

        $sprintId = $request->query('sprint_id');

        $columns = $board->columns()
            ->orderBy('position')
            ->get()
            ->map(fn ($col) => [
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
            ]);

        return Inertia::render('projects/board', [
            'workspace' => [
                'id' => $workspace->id,
                'name' => $workspace->name,
                'slug' => $workspace->slug,
            ],
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'key' => $project->key,
                'slug' => $project->slug,
            ],
            'board' => [
                'id' => $board->id,
                'name' => $board->name,
                'type' => $board->type,
                'swimlane_field' => $board->swimlane_field,
            ],
            'allBoards' => $project->boards()->orderBy('name')->get(['id', 'name', 'type']),
            'columns' => $columns,
            'taskTypes' => $workspace->taskTypes()->select('id', 'name', 'key', 'color')->get(),
            'priorities' => $workspace->priorities()->select('id', 'name', 'key', 'level')->get(),
            'epics' => $project->epics()->orderBy('name')->get(['id', 'name', 'color', 'status']),
            'sprints' => $project->sprints()->orderByRaw("CASE status WHEN 'active' THEN 0 WHEN 'planned' THEN 1 WHEN 'completed' THEN 2 ELSE 3 END")->orderByDesc('start_date')->get(['id', 'name', 'status', 'start_date', 'end_date']),
            'activeSprintId' => $sprintId ? (int) $sprintId : null,
            'userProjectRole' => $project->members()->where('user_id', $request->user()->id)->value('role'),
        ]);
    }

    public function store(StoreBoardRequest $request, Workspace $workspace, Project $project): RedirectResponse
    {
        Gate::authorize('board.manage');

        $validated = $request->validated();

        $board = $project->boards()->create([
            'name' => $validated['name'],
            'type' => $validated['type'] ?? 'kanban',
            'is_default' => ! $project->boards()->exists(),
        ]);

        // Create default columns for new board
        $defaultColumns = [
            ['name' => 'Todo', 'status_key' => 'todo', 'position' => 0],
            ['name' => 'In Progress', 'status_key' => 'in_progress', 'position' => 1],
            ['name' => 'Review', 'status_key' => 'review', 'position' => 2],
            ['name' => 'Done', 'status_key' => 'done', 'position' => 3, 'is_done_column' => true],
        ];

        foreach ($defaultColumns as $i => $col) {
            $board->columns()->create($col);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Board created.']);

        return back(303);
    }

    public function update(UpdateBoardRequest $request, Workspace $workspace, Project $project, Board $board): RedirectResponse
    {
        Gate::authorize('update', $board);

        $validated = $request->validated();

        $board->update([
            'name' => $validated['name'],
            'type' => $validated['type'] ?? $board->type,
            'swimlane_field' => $validated['swimlane_field'] ?? $board->swimlane_field,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Board updated.']);

        return back(303);
    }

    public function destroy(Workspace $workspace, Project $project, Board $board): RedirectResponse
    {
        Gate::authorize('delete', $board);

        if ($board->is_default) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Cannot delete the default board.']);

            return back(303);
        }

        $board->delete();

        Inertia::flash('toast', ['type' => 'info', 'message' => 'Board deleted.']);

        return back(303);
    }
}
