<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskTypeRequest;
use App\Http\Requests\UpdateTaskTypeRequest;
use App\Models\TaskType;
use App\Models\Workspace;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TaskTypeController extends Controller
{
    public function store(StoreTaskTypeRequest $request, Workspace $workspace): RedirectResponse
    {
        Gate::authorize('workspace.manage-task-types');

        $validated = $request->validated();

        $workspace->taskTypes()->create([
            'workspace_id' => $workspace->id,
            'name' => $validated['name'],
            'key' => $validated['key'] ?? Str::slug($validated['name']),
            'color' => $validated['color'] ?? null,
            'icon' => $validated['icon'] ?? null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Task type created.']);

        return back();
    }

    public function update(UpdateTaskTypeRequest $request, Workspace $workspace, TaskType $taskType): RedirectResponse
    {
        Gate::authorize('workspace.manage-task-types');

        abort_unless((int) $taskType->workspace_id === (int) $workspace->id, 404);

        $validated = $request->validated();

        $taskType->update([
            'name' => $validated['name'],
            'key' => $validated['key'] ?? $taskType->key,
            'color' => $validated['color'] ?? null,
            'icon' => $validated['icon'] ?? null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Task type updated.']);

        return back();
    }

    public function destroy(Workspace $workspace, TaskType $taskType): RedirectResponse
    {
        Gate::authorize('update', $workspace);

        abort_unless((int) $taskType->workspace_id === (int) $workspace->id, 404);

        if ($taskType->tasks()->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Cannot delete task type that has tasks assigned.']);

            return back();
        }

        $taskType->delete();

        Inertia::flash('toast', ['type' => 'info', 'message' => 'Task type deleted.']);

        return back();
    }
}
