<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Sprint;
use App\Models\Task;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class BacklogController extends Controller
{
    public function index(Workspace $workspace, Project $project, Request $request): Response
    {
        Gate::authorize('view', $project);

        $sprints = $project->sprints()
            ->where('is_backlog', false)
            ->withCount('tasks')
            ->orderByRaw("CASE status WHEN 'active' THEN 0 WHEN 'planned' THEN 1 WHEN 'completed' THEN 2 ELSE 3 END")
            ->orderByDesc('start_date')
            ->get(['id', 'name', 'goal', 'status', 'start_date', 'end_date', 'completed_at']);

        $backlogTasks = $project->tasks()
            ->whereDoesntHave('sprints', fn ($q) => $q->where('is_backlog', false))
            ->whereNull('archived_at')
            ->orderBy('position')
            ->with(['priority:id,name,key,level,color', 'taskType:id,name,key,color', 'assignees:id,name,avatar', 'boardColumn:id,name,status_key,color'])
            ->get()
            ->map(fn ($task) => [
                'id' => $task->id,
                'task_number' => $task->task_number,
                'code' => $task->code,
                'title' => $task->title,
                'status' => $task->status,
                'position' => $task->position,
                'due_date' => $task->due_date,
                'story_points' => $task->story_points,
                'priority' => $task->priority,
                'task_type' => $task->taskType,
                'assignees' => $task->assignees,
                'board_column' => $task->boardColumn,
            ]);

        return Inertia::render('projects/backlog/index', [
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
            'sprints' => $sprints,
            'backlogTasks' => $backlogTasks,
            'userProjectRole' => $project->members()->where('user_id', $request->user()->id)->value('role'),
        ]);
    }

    public function indexJson(Workspace $workspace, Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        $sprints = $project->sprints()
            ->where('is_backlog', false)
            ->withCount('tasks')
            ->orderByRaw("CASE status WHEN 'active' THEN 0 WHEN 'planned' THEN 1 WHEN 'completed' THEN 2 ELSE 3 END")
            ->orderByDesc('start_date')
            ->get(['id', 'name', 'goal', 'status', 'start_date', 'end_date', 'completed_at']);

        $backlogTasks = $project->tasks()
            ->whereDoesntHave('sprints', fn ($q) => $q->where('is_backlog', false))
            ->whereNull('archived_at')
            ->orderBy('position')
            ->with(['priority:id,name,key,level,color', 'taskType:id,name,key,color', 'assignees:id,name,avatar', 'boardColumn:id,name,status_key,color'])
            ->get()
            ->map(fn ($task) => [
                'id' => $task->id,
                'task_number' => $task->task_number,
                'code' => $task->code,
                'title' => $task->title,
                'status' => $task->status,
                'position' => $task->position,
                'due_date' => $task->due_date,
                'story_points' => $task->story_points,
                'priority' => $task->priority,
                'task_type' => $task->taskType,
                'assignees' => $task->assignees,
                'board_column' => $task->boardColumn,
            ]);

        return response()->json([
            'sprints' => $sprints,
            'backlog_tasks' => $backlogTasks,
        ]);
    }

    public function reorder(Request $request, Workspace $workspace, Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        $validated = $request->validate([
            'task_ids' => ['required', 'array'],
            'task_ids.*' => ['integer', 'exists:tasks,id'],
        ]);

        DB::transaction(function () use ($validated, $project) {
            foreach ($validated['task_ids'] as $position => $taskId) {
                $project->tasks()
                    ->where('id', $taskId)
                    ->update(['position' => $position]);
            }
        });

        return response()->json(['ok' => true]);
    }

    public function addToSprint(Request $request, Workspace $workspace, Project $project, Sprint $sprint): JsonResponse
    {
        Gate::authorize('update', $project);

        abort_if((int) $sprint->project_id !== (int) $project->id, 404);
        abort_if($sprint->is_backlog, 422);

        $validated = $request->validate([
            'task_id' => ['required', 'integer', 'exists:tasks,id'],
        ]);

        $task = Task::findOrFail($validated['task_id']);

        $task->sprints()->detach();
        $sprint->tasks()->attach($task->id);

        return response()->json(['ok' => true]);
    }
}
