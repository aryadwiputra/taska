<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProjectMemberRequest;
use App\Http\Requests\UpdateProjectMemberRequest;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use App\Models\Workspace;
use App\Services\WorkspaceRoleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class ProjectMemberController extends Controller
{
    public function store(StoreProjectMemberRequest $request, Workspace $workspace, Project $project, WorkspaceRoleService $roleService): RedirectResponse
    {
        Gate::authorize('manageMembers', $project);

        $validated = $request->validated();

        $exists = $project->members()->where('user_id', $validated['user_id'])->exists();

        if ($exists) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => 'User is already a member.']);

            return back();
        }

        if (! $workspace->members()->where('user_id', $validated['user_id'])->exists()) {
            $workspace->members()->create([
                'user_id' => $validated['user_id'],
                'role' => 'member',
                'invited_by' => $request->user()->id,
                'status' => 'active',
            ]);

            $roleService->syncRole(
                User::findOrFail($validated['user_id']),
                $workspace,
                'member',
            );
        }

        $project->members()->create([
            'user_id' => $validated['user_id'],
            'role' => $validated['role'],
            'added_by' => $request->user()->id,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Member added.']);

        return back();
    }

    public function update(UpdateProjectMemberRequest $request, Workspace $workspace, Project $project, ProjectMember $member): RedirectResponse
    {
        Gate::authorize('manageMembers', $project);

        if ($member->project_id !== $project->id) {
            abort(404);
        }

        $validated = $request->validated();

        $member->update(['role' => $validated['role']]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Member role updated.']);

        return back();
    }

    public function destroy(Workspace $workspace, Project $project, ProjectMember $member): RedirectResponse
    {
        Gate::authorize('manageMembers', $project);

        if ($member->project_id !== $project->id) {
            abort(404);
        }

        $leadCount = $project->members()->where('role', 'lead')->count();

        if ($member->role === 'lead' && $leadCount <= 1) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Cannot remove the last lead.']);

            return back();
        }

        $member->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Member removed.']);

        return back();
    }
}
