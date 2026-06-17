<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEpicRequest;
use App\Http\Requests\UpdateEpicRequest;
use App\Models\Epic;
use App\Models\Project;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class EpicController extends Controller
{
    public function index(Workspace $workspace, Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        return response()->json([
            'epics' => $project->epics()
                ->withCount('tasks')
                ->orderBy('name')
                ->get(['id', 'name', 'summary', 'color', 'start_date', 'due_date', 'status']),
        ]);
    }

    public function show(Workspace $workspace, Project $project, Epic $epic): Response
    {
        Gate::authorize('view', $project);

        $this->ensureEpicBelongsToProject($epic, $project);

        $epic->loadCount('tasks');

        $epic->load(['tasks' => function ($query) {
            $query->orderBy('status')
                ->orderBy('position')
                ->with(['priority:id,name,key,level,color', 'taskType:id,name,key,color', 'assignees:id,name,avatar', 'boardColumn:id,name,status_key,color']);
        }]);

        $epic->setRelation('tasks', $epic->tasks->map(fn ($task) => [
            'id' => $task->id,
            'task_number' => $task->task_number,
            'code' => $task->code,
            'title' => $task->title,
            'status' => $task->status,
            'due_date' => $task->due_date,
            'completed_at' => $task->completed_at,
            'priority' => $task->priority,
            'task_type' => $task->taskType,
            'assignees' => $task->assignees,
            'board_column' => $task->boardColumn,
        ]));

        $availableTasks = $project->tasks()
            ->whereDoesntHave('epics', fn ($q) => $q->where('epic_id', $epic->id))
            ->orderBy('code')
            ->get(['id', 'code', 'title']);

        return Inertia::render('projects/epics/show', [
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
            'epic' => $epic->only('id', 'name', 'summary', 'color', 'start_date', 'due_date', 'status', 'tasks_count'),
            'epicTasks' => $epic->tasks,
            'availableTasks' => $availableTasks,
        ]);
    }

    public function addTask(Request $request, Workspace $workspace, Project $project, Epic $epic): RedirectResponse
    {
        Gate::authorize('update', $project);

        $this->ensureEpicBelongsToProject($epic, $project);

        $validated = $request->validate([
            'task_id' => ['required', 'integer', 'exists:tasks,id'],
        ]);

        $epic->tasks()->syncWithoutDetaching([$validated['task_id']]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Task added to epic.']);

        return back();
    }

    public function removeTask(Request $request, Workspace $workspace, Project $project, Epic $epic): RedirectResponse
    {
        Gate::authorize('update', $project);

        $this->ensureEpicBelongsToProject($epic, $project);

        $validated = $request->validate([
            'task_id' => ['required', 'integer', 'exists:tasks,id'],
        ]);

        $epic->tasks()->detach($validated['task_id']);

        Inertia::flash('toast', ['type' => 'info', 'message' => 'Task removed from epic.']);

        return back();
    }

    public function store(StoreEpicRequest $request, Workspace $workspace, Project $project): RedirectResponse
    {
        $validated = $request->validated();

        $project->epics()->create([
            'name' => $validated['name'],
            'summary' => $validated['summary'] ?? null,
            'color' => $validated['color'] ?? null,
            'start_date' => $validated['start_date'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'status' => $validated['status'] ?? 'active',
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Epic created.']);

        return back();
    }

    public function update(UpdateEpicRequest $request, Workspace $workspace, Project $project, Epic $epic): RedirectResponse
    {
        $this->ensureEpicBelongsToProject($epic, $project);

        $epic->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Epic updated.']);

        return back();
    }

    public function destroy(Workspace $workspace, Project $project, Epic $epic): RedirectResponse
    {
        Gate::authorize('update', $project);

        $this->ensureEpicBelongsToProject($epic, $project);

        $epic->tasks()->detach();
        $epic->delete();

        Inertia::flash('toast', ['type' => 'info', 'message' => 'Epic deleted.']);

        return back();
    }

    private function ensureEpicBelongsToProject(Epic $epic, Project $project): void
    {
        abort_unless((int) $epic->project_id === (int) $project->id, 404);
    }
}
