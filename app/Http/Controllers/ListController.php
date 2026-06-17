<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Workspace;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ListController extends Controller
{
    public function index(Workspace $workspace, Project $project): Response
    {
        Gate::authorize('view', $project);

        $tasks = $project->tasks()
            ->with(['assignees:id,name,avatar', 'priority:id,name,key,level,color', 'taskType:id,name,key,color', 'boardColumn:id,name,status_key,color', 'labels:id,name,slug,color', 'epics:id,name,color,status', 'sprints:id,name,status,start_date,end_date'])
            ->latest('tasks.created_at')
            ->get()
            ->map(fn ($task) => [
                'id' => $task->id,
                'code' => $task->code,
                'title' => $task->title,
                'status' => $task->status,
                'start_date' => $task->start_date,
                'due_date' => $task->due_date,
                'created_at' => $task->created_at,
                'updated_at' => $task->updated_at,
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
                'board_column' => [
                    'id' => $task->boardColumn->id,
                    'name' => $task->boardColumn->name,
                    'status_key' => $task->boardColumn->status_key,
                    'color' => $task->boardColumn->color,
                ],
                'assignees' => $task->assignees->map(fn ($user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'avatar' => $user->avatar,
                ]),
                'labels' => $task->labels->map(fn ($label) => [
                    'id' => $label->id,
                    'name' => $label->name,
                    'slug' => $label->slug,
                    'color' => $label->color,
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
            ]);

        $members = $project->members()
            ->with('user:id,name,email,avatar')
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'user_id' => $m->user_id,
                'name' => $m->user->name,
                'email' => $m->user->email,
                'avatar' => $m->user->avatar,
                'role' => $m->role,
            ]);

        $boardColumns = $project->boards()
            ->with(['columns' => fn ($query) => $query->orderBy('position')])
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get(['id', 'name', 'is_default'])
            ->flatMap(fn ($board) => $board->columns->map(fn ($column) => [
                'id' => $column->id,
                'name' => $column->name,
                'status_key' => $column->status_key,
                'color' => $column->color,
                'board' => [
                    'id' => $board->id,
                    'name' => $board->name,
                    'is_default' => $board->is_default,
                ],
            ]))
            ->values();

        $priorities = $workspace->priorities()
            ->orderBy('level')
            ->get(['id', 'name', 'key', 'level', 'color'])
            ->map(fn ($priority) => [
                'id' => $priority->id,
                'name' => $priority->name,
                'key' => $priority->key,
                'level' => $priority->level,
                'color' => $priority->color,
            ]);

        $labels = $project->labels()
            ->withCount('tasks')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'color'])
            ->map(fn ($label) => [
                'id' => $label->id,
                'name' => $label->name,
                'slug' => $label->slug,
                'color' => $label->color,
                'tasks_count' => $label->tasks_count,
            ]);

        return Inertia::render('projects/list/index', [
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
                'color' => $project->color,
            ],
            'tasks' => $tasks,
            'members' => $members,
            'boardColumns' => $boardColumns,
            'priorities' => $priorities,
            'labels' => $labels,
        ]);
    }
}
