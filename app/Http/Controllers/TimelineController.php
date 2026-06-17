<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Workspace;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TimelineController extends Controller
{
    public function index(Workspace $workspace, Project $project): Response
    {
        Gate::authorize('view', $project);

        $tasks = $project->tasks()
            ->with(['assignees:id,name,avatar', 'priority:id,name,key,level,color', 'taskType:id,name,key,color', 'boardColumn:id,name,status_key,color', 'epics:id,name,color,status', 'sprints:id,name,status,start_date,end_date'])
            ->whereNotNull('start_date')
            ->orWhereNotNull('due_date')
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

        return Inertia::render('projects/timeline/index', [
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
        ]);
    }
}
