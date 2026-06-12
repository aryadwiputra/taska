<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWorkspaceRequest;
use App\Http\Requests\UpdateWorkspaceRequest;
use App\Models\Workspace;
use App\Services\SettingService;
use App\Services\WorkspaceRoleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceController extends Controller
{
    public function index(Request $request): Response
    {
        $showArchived = $request->boolean('archived');

        $workspaces = $request->user()->workspaces()
            ->when($showArchived, fn ($q) => $q->withTrashed())
            ->withCount('members')
            ->get()
            ->map(fn ($workspace) => [
                'id' => $workspace->id,
                'name' => $workspace->name,
                'slug' => $workspace->slug,
                'description' => $workspace->description,
                'logo' => $workspace->logo,
                'status' => $workspace->status,
                'members_count' => $workspace->members_count,
                'deleted_at' => $workspace->deleted_at,
                'created_at' => $workspace->created_at,
            ]);

        return Inertia::render('workspaces/index', [
            'workspaces' => $workspaces,
            'showArchived' => $showArchived,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('workspaces/create');
    }

    public function store(StoreWorkspaceRequest $request, WorkspaceRoleService $roleService): RedirectResponse
    {
        $workspace = Workspace::create([
            'owner_id' => $request->user()->id,
            'name' => $request->validated('name'),
            'slug' => $request->validated('slug'),
            'description' => $request->validated('description'),
        ]);

        $workspace->members()->create([
            'user_id' => $request->user()->id,
            'role' => 'owner',
            'status' => 'active',
        ]);

        $roleService->syncRole($request->user(), $workspace, 'owner');

        session()->put('current_workspace_id', $workspace->id);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Workspace created.']);

        return to_route('workspaces.settings', $workspace);
    }

    public function show(Workspace $workspace): RedirectResponse
    {
        Gate::authorize('view', $workspace);

        return to_route('workspaces.settings', $workspace);
    }

    public function edit(Workspace $workspace, SettingService $settings): Response
    {
        Gate::authorize('update', $workspace);

        $members = $workspace->members()
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

        return Inertia::render('workspaces/settings', [
            'workspace' => [
                'id' => $workspace->id,
                'name' => $workspace->name,
                'slug' => $workspace->slug,
                'description' => $workspace->description,
                'logo' => $workspace->logo,
                'status' => $workspace->status,
                'deleted_at' => $workspace->deleted_at,
                'created_at' => $workspace->created_at,
            ],
            'members' => $members,
            'settings' => $settings->all($workspace),
            'taskTypes' => $workspace->taskTypes()->orderBy('name')->get(['id', 'name', 'key', 'icon', 'color']),
            'priorities' => $workspace->priorities()->orderBy('level')->get(['id', 'name', 'key', 'level', 'color']),
        ]);
    }

    public function update(UpdateWorkspaceRequest $request, Workspace $workspace): RedirectResponse
    {
        $workspace->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Workspace updated.']);

        return back();
    }

    public function destroy(Workspace $workspace): RedirectResponse
    {
        Gate::authorize('delete', $workspace);

        $workspace->delete();

        session()->forget('current_workspace_id');

        Inertia::flash('toast', ['type' => 'info', 'message' => 'Workspace archived.']);

        return to_route('workspaces.index');
    }

    public function restore(string $workspace): RedirectResponse
    {
        $workspace = Workspace::withTrashed()
            ->where('id', $workspace)
            ->orWhere('slug', $workspace)
            ->firstOrFail();

        Gate::authorize('restore', $workspace);

        $workspace->restore();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Workspace restored.']);

        return back();
    }

    public function switch(Workspace $workspace): RedirectResponse
    {
        Gate::authorize('view', $workspace);

        session()->put('current_workspace_id', $workspace->id);
        setPermissionsTeamId($workspace->id);

        return back();
    }
}
