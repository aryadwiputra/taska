<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\SlaPolicy;
use App\Models\Workspace;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SlaPolicyController extends Controller
{
    public function index(Workspace $workspace, Project $project): Response
    {
        Gate::authorize('view', $project);

        $policies = $project->slaPolicies()
            ->with('taskType:id,name,key,color')
            ->orderBy('created_at')
            ->get();

        return Inertia::render('projects/settings/sla', [
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
            'policies' => $policies->map(fn ($p) => [
                'id' => $p->id,
                'task_type' => $p->taskType,
                'response_hours' => $p->response_hours,
                'resolution_hours' => $p->resolution_hours,
                'enabled' => $p->enabled,
            ]),
            'taskTypes' => $workspace->taskTypes()->orderBy('name')->get(['id', 'name', 'key', 'color']),
        ]);
    }

    public function store(Request $request, Workspace $workspace, Project $project): RedirectResponse
    {
        Gate::authorize('update', $project);

        $validated = $request->validate([
            'task_type_id' => ['required', 'integer', 'exists:task_types,id'],
            'response_hours' => ['required', 'integer', 'min:1'],
            'resolution_hours' => ['required', 'integer', 'min:1'],
        ]);

        $project->slaPolicies()->updateOrCreate(
            ['task_type_id' => $validated['task_type_id']],
            $validated,
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'SLA policy saved.']);

        return back();
    }

    public function update(Request $request, Workspace $workspace, Project $project, SlaPolicy $slaPolicy): RedirectResponse
    {
        Gate::authorize('update', $project);
        abort_unless((int) $slaPolicy->project_id === (int) $project->id, 404);

        $validated = $request->validate([
            'response_hours' => ['required', 'integer', 'min:1'],
            'resolution_hours' => ['required', 'integer', 'min:1'],
            'enabled' => ['boolean'],
        ]);

        $slaPolicy->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'SLA policy updated.']);

        return back();
    }

    public function destroy(Workspace $workspace, Project $project, SlaPolicy $slaPolicy): RedirectResponse
    {
        Gate::authorize('update', $project);
        abort_unless((int) $slaPolicy->project_id === (int) $project->id, 404);

        $slaPolicy->delete();

        Inertia::flash('toast', ['type' => 'info', 'message' => 'SLA policy deleted.']);

        return back();
    }
}
