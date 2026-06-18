<?php

namespace App\Http\Controllers;

use App\Models\NotificationRule;
use App\Models\Project;
use App\Models\Workspace;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class NotificationRuleController extends Controller
{
    public function store(Request $request, Workspace $workspace, Project $project): RedirectResponse
    {
        Gate::authorize('update', $project);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'event_type' => 'required|string|max:100',
            'conditions' => 'nullable|array',
            'channels' => 'required|array|min:1',
            'channels.*' => 'string|in:in_app,email',
            'enabled' => 'boolean',
            'project_scope' => 'string|in:this_project,all_projects',
        ]);

        NotificationRule::create([
            'user_id' => $request->user()->id,
            'project_id' => ($validated['project_scope'] ?? 'this_project') === 'this_project' ? $project->id : null,
            'name' => $validated['name'],
            'event_type' => $validated['event_type'],
            'conditions' => $validated['conditions'] ?? null,
            'channels' => $validated['channels'],
            'enabled' => $validated['enabled'] ?? true,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Notification rule created.']);

        return back(303);
    }

    public function update(Request $request, Workspace $workspace, Project $project, NotificationRule $rule): RedirectResponse
    {
        Gate::authorize('update', $project);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'event_type' => 'required|string|max:100',
            'conditions' => 'nullable|array',
            'channels' => 'required|array|min:1',
            'channels.*' => 'string|in:in_app,email',
            'enabled' => 'boolean',
            'project_scope' => 'string|in:this_project,all_projects',
        ]);

        $rule->update([
            'name' => $validated['name'],
            'event_type' => $validated['event_type'],
            'conditions' => $validated['conditions'] ?? null,
            'channels' => $validated['channels'],
            'enabled' => $validated['enabled'] ?? true,
            'project_id' => ($validated['project_scope'] ?? 'this_project') === 'this_project' ? $project->id : null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Notification rule updated.']);

        return back(303);
    }

    public function destroy(Workspace $workspace, Project $project, NotificationRule $rule): RedirectResponse
    {
        Gate::authorize('update', $project);

        $rule->delete();

        Inertia::flash('toast', ['type' => 'info', 'message' => 'Notification rule deleted.']);

        return back(303);
    }

    public function toggle(Workspace $workspace, Project $project, NotificationRule $rule): RedirectResponse
    {
        Gate::authorize('update', $project);

        $rule->update(['enabled' => ! $rule->enabled]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $rule->enabled ? 'Rule enabled.' : 'Rule disabled.',
        ]);

        return back(303);
    }
}
