<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWorkspaceMemberRequest;
use App\Http\Requests\UpdateWorkspaceMemberRequest;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use App\Services\WorkspaceRoleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class WorkspaceMemberController extends Controller
{
    public function index(Workspace $workspace)
    {
        Gate::authorize('manageMembers', $workspace);

        return $workspace->members()
            ->with('user:id,name,email,avatar')
            ->get()
            ->map(fn ($member) => [
                'id' => $member->id,
                'user_id' => $member->user_id,
                'name' => $member->user->name,
                'email' => $member->user->email,
                'avatar' => $member->user->avatar,
                'role' => $member->role,
                'status' => $member->status,
            ]);
    }

    public function store(StoreWorkspaceMemberRequest $request, Workspace $workspace, WorkspaceRoleService $roleService): RedirectResponse
    {
        $validated = $request->validated();

        $exists = $workspace->members()->where('user_id', $validated['user_id'])->exists();

        if ($exists) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => 'User is already a member.']);

            return back();
        }

        $workspace->members()->create([
            'user_id' => $validated['user_id'],
            'role' => $validated['role'],
            'invited_by' => $request->user()->id,
            'status' => 'active',
        ]);

        $roleService->syncRole(User::findOrFail($validated['user_id']), $workspace, $validated['role']);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Member added.']);

        return back();
    }

    public function update(UpdateWorkspaceMemberRequest $request, Workspace $workspace, WorkspaceMember $member, WorkspaceRoleService $roleService): RedirectResponse
    {
        if ($member->workspace_id !== $workspace->id) {
            abort(404);
        }

        $validated = $request->validated();

        $member->update(['role' => $validated['role']]);
        $roleService->syncRole($member->user, $workspace, $validated['role']);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Member role updated.']);

        return back();
    }

    public function destroy(Workspace $workspace, WorkspaceMember $member, WorkspaceRoleService $roleService): RedirectResponse
    {
        Gate::authorize('manageMembers', $workspace);

        if ($member->workspace_id !== $workspace->id) {
            abort(404);
        }

        $ownerCount = $workspace->members()->where('role', 'owner')->count();

        if ($member->role === 'owner' && $ownerCount <= 1) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Cannot remove the last owner.']);

            return back();
        }

        $member->delete();
        $roleService->removeRoles($member->user, $workspace);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Member removed.']);

        return back();
    }
}
