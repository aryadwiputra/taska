<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Workspace;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CrossProjectController extends Controller
{
    public function timeline(Workspace $workspace): Response
    {
        Gate::authorize('view', $workspace);

        $projects = $workspace->projects()
            ->with('epics')
            ->get();

        $tasks = Task::whereHas('project', fn ($q) => $q->where('workspace_id', $workspace->id))
            ->whereNull('archived_at')
            ->whereNotNull('start_date')
            ->whereNotNull('due_date')
            ->with([
                'assignees:id,name,avatar',
                'priority:id,name,key,color',
                'boardColumn:id,name,status_key,color',
                'epics',
                'project:id,name,key,slug,color',
            ])
            ->get()
            ->map(fn (Task $task) => [
                'id' => $task->id,
                'code' => $task->code,
                'title' => $task->title,
                'status' => $task->status,
                'start_date' => $task->start_date->format('Y-m-d'),
                'due_date' => $task->due_date->format('Y-m-d'),
                'completed_at' => $task->completed_at?->format('Y-m-d'),
                'priority' => $task->priority,
                'board_column' => $task->boardColumn,
                'assignees' => $task->assignees,
                'epics' => $task->epics,
                'project' => [
                    'id' => $task->project->id,
                    'name' => $task->project->name,
                    'key' => $task->project->key,
                    'slug' => $task->project->slug,
                    'color' => $task->project->color,
                ],
            ]);

        return Inertia::render('workspaces/cross-project/timeline', [
            'workspace' => [
                'id' => $workspace->id,
                'name' => $workspace->name,
                'slug' => $workspace->slug,
            ],
            'projects' => $projects->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'key' => $p->key,
                'slug' => $p->slug,
                'color' => $p->color,
                'epics_count' => $p->epics->count(),
            ]),
            'tasks' => $tasks,
        ]);
    }

    public function board(Workspace $workspace): Response
    {
        Gate::authorize('view', $workspace);

        $projects = $workspace->projects()
            ->with('boards')
            ->get();

        $allColumns = $projects->flatMap(function ($project) {
            $defaultBoard = $project->boards->firstWhere('is_default', true)
                ?? $project->boards->first();

            if (! $defaultBoard) {
                return collect();
            }

            return $defaultBoard->columns()
                ->orderBy('position')
                ->get()
                ->map(fn ($col) => [
                    'id' => $col->id,
                    'name' => $col->name,
                    'status_key' => $col->status_key,
                    'color' => $col->color,
                    'project' => [
                        'id' => $project->id,
                        'name' => $project->name,
                        'key' => $project->key,
                        'slug' => $project->slug,
                        'color' => $project->color,
                    ],
                ]);
        })->unique('status_key')->values();

        $tasks = Task::whereHas('project', fn ($q) => $q->where('workspace_id', $workspace->id))
            ->whereNull('archived_at')
            ->with([
                'assignees:id,name,avatar',
                'priority:id,name,key,color',
                'boardColumn:id,name,status_key,color',
                'epics',
                'project:id,name,key,slug,color',
            ])
            ->get()
            ->map(fn (Task $task) => [
                'id' => $task->id,
                'code' => $task->code,
                'title' => $task->title,
                'status' => $task->status,
                'story_points' => $task->story_points,
                'priority' => $task->priority,
                'board_column' => $task->boardColumn,
                'assignees' => $task->assignees,
                'epics' => $task->epics,
                'project' => [
                    'id' => $task->project->id,
                    'name' => $task->project->name,
                    'key' => $task->project->key,
                    'slug' => $task->project->slug,
                    'color' => $task->project->color,
                ],
            ]);

        return Inertia::render('workspaces/cross-project/board', [
            'workspace' => [
                'id' => $workspace->id,
                'name' => $workspace->name,
                'slug' => $workspace->slug,
            ],
            'columns' => $allColumns,
            'tasks' => $tasks,
            'projects' => $projects->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'key' => $p->key,
                'slug' => $p->slug,
                'color' => $p->color,
            ]),
        ]);
    }
}
