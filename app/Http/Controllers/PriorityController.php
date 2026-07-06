<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePriorityRequest;
use App\Http\Requests\UpdatePriorityRequest;
use App\Models\Priority;
use App\Models\Workspace;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PriorityController extends Controller
{
    public function store(StorePriorityRequest $request, Workspace $workspace): RedirectResponse
    {
        Gate::authorize('workspace.manage-priorities');

        $validated = $request->validated();

        $workspace->priorities()->create([
            'workspace_id' => $workspace->id,
            'name' => $validated['name'],
            'key' => $validated['key'] ?? Str::slug($validated['name']),
            'level' => $validated['level'],
            'color' => $validated['color'] ?? null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Priority created.']);

        return back();
    }

    public function update(UpdatePriorityRequest $request, Workspace $workspace, Priority $priority): RedirectResponse
    {
        Gate::authorize('workspace.manage-priorities');

        abort_unless((int) $priority->workspace_id === (int) $workspace->id, 404);

        $validated = $request->validated();

        $priority->update([
            'name' => $validated['name'],
            'key' => $validated['key'] ?? $priority->key,
            'level' => $validated['level'],
            'color' => $validated['color'] ?? null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Priority updated.']);

        return back();
    }

    public function destroy(Workspace $workspace, Priority $priority): RedirectResponse
    {
        Gate::authorize('update', $workspace);

        abort_unless((int) $priority->workspace_id === (int) $workspace->id, 404);

        if ($priority->tasks()->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Cannot delete priority that has tasks assigned.']);

            return back();
        }

        $priority->delete();

        Inertia::flash('toast', ['type' => 'info', 'message' => 'Priority deleted.']);

        return back();
    }
}
