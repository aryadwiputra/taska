<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminWorkspaceController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $showArchived = $request->boolean('archived');

        $workspaces = Workspace::query()
            ->when($showArchived, fn ($q) => $q->withTrashed())
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            }))
            ->withCount('members')
            ->withCount('projects')
            ->latest()
            ->paginate(15)
            ->through(fn ($workspace) => [
                'id' => $workspace->id,
                'name' => $workspace->name,
                'slug' => $workspace->slug,
                'status' => $workspace->status,
                'members_count' => $workspace->members_count,
                'projects_count' => $workspace->projects_count,
                'deleted_at' => $workspace->deleted_at,
                'created_at' => $workspace->created_at,
            ]);

        return Inertia::render('admin/workspaces/index', [
            'workspaces' => $workspaces,
            'filters' => ['search' => $search, 'archived' => $showArchived],
        ]);
    }

    public function show(Workspace $workspace): Response
    {
        $members = $workspace->members()
            ->with('user:id,name,email')
            ->get()
            ->map(fn ($member) => [
                'id' => $member->id,
                'user_id' => $member->user_id,
                'name' => $member->user->name,
                'email' => $member->user->email,
                'role' => $member->role,
                'status' => $member->status,
                'joined_at' => $member->joined_at,
            ]);

        return Inertia::render('admin/workspaces/show', [
            'workspace' => [
                'id' => $workspace->id,
                'name' => $workspace->name,
                'slug' => $workspace->slug,
                'description' => $workspace->description,
                'status' => $workspace->status,
                'created_at' => $workspace->created_at,
            ],
            'members' => $members,
        ]);
    }
}
