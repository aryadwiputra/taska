<?php

namespace App\Http\Controllers;

use App\Http\Requests\BulkStoreUserAssignmentRequest;
use App\Http\Requests\StoreUserAssignmentRequest;
use App\Http\Requests\UpdateUserAssignmentRequest;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\Workspace;
use App\Notifications\ProjectAssignmentNotification;
use App\Services\RealtimeGatewayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class WorkspaceUserAssignmentController extends Controller
{
    public function index(Workspace $workspace): JsonResponse
    {
        Gate::authorize('manageMembers', $workspace);

        $users = $workspace->members()
            ->with(['user.projectMembers.project:id,name,key,workspace_id'])
            ->when(request()->q, fn ($q, $v) => $q->whereHas('user', fn ($uq) => $uq->where('name', 'like', "%{$v}%")
                ->orWhere('email', 'like', "%{$v}%")
            )
            )
            ->get()
            ->map(fn ($member) => [
                'user_id' => $member->user->id,
                'member_id' => $member->id,
                'name' => $member->user->name,
                'email' => $member->user->email,
                'avatar' => $member->user->avatar,
                'workspace_role' => $member->role,
                'assignments' => $member->user->projectMembers
                    ->where('project.workspace_id', $workspace->id)
                    ->map(fn ($pm) => [
                        'id' => $pm->id,
                        'project_id' => $pm->project_id,
                        'project_name' => $pm->project->name,
                        'project_key' => $pm->project->key,
                        'role' => $pm->role,
                    ])->values(),
            ]);

        $projects = $workspace->projects()
            ->orderBy('name')
            ->get(['id', 'name', 'key']);

        return response()->json([
            'users' => $users,
            'projects' => $projects,
        ]);
    }

    public function store(StoreUserAssignmentRequest $request, Workspace $workspace): JsonResponse
    {
        $project = $workspace->projects()->findOrFail($request->project_id);

        $member = $project->members()->create([
            'user_id' => $request->user_id,
            'role' => $request->role,
            'added_by' => auth()->id(),
        ]);

        $member->user->notify(new ProjectAssignmentNotification($project, $request->role));

        app(RealtimeGatewayService::class)->broadcast("workspace.{$workspace->id}", 'user.assigned', [
            'user_id' => $request->user_id,
            'project_id' => $project->id,
            'role' => $request->role,
        ]);

        return response()->json($member, 201);
    }

    public function bulkStore(BulkStoreUserAssignmentRequest $request, Workspace $workspace): JsonResponse
    {
        $projects = $workspace->projects()->whereIn('id', $request->project_ids)->get();
        $role = $request->role;

        DB::transaction(function () use ($request, $projects, $role) {
            foreach ($request->user_ids as $userId) {
                foreach ($projects as $project) {
                    $project->members()->updateOrCreate(
                        ['user_id' => $userId],
                        ['role' => $role, 'added_by' => auth()->id()],
                    );
                }
            }
        });

        return response()->json(['message' => 'ok'], 201);
    }

    public function update(UpdateUserAssignmentRequest $request, Workspace $workspace, int $projectMember): JsonResponse
    {
        $member = ProjectMember::findOrFail($projectMember);
        $project = Project::findOrFail($member->project_id);

        if ($project->workspace_id !== $workspace->id) {
            abort(404);
        }

        $member->update(['role' => $request->role]);

        app(RealtimeGatewayService::class)->broadcast("workspace.{$workspace->id}", 'user.assignment.updated', [
            'member_id' => $member->id,
            'role' => $request->role,
        ]);

        return response()->json($member);
    }

    public function destroy(Workspace $workspace, int $projectMember): JsonResponse
    {
        $member = ProjectMember::findOrFail($projectMember);
        $project = Project::findOrFail($member->project_id);

        if ($project->workspace_id !== $workspace->id) {
            abort(404);
        }

        if ($member->role === 'lead') {
            $leadCount = $project->members()->where('role', 'lead')->count();

            if ($leadCount <= 1) {
                return response()->json(['message' => 'Cannot remove the last lead from the project.'], 422);
            }
        }

        $member->delete();

        app(RealtimeGatewayService::class)->broadcast("workspace.{$workspace->id}", 'user.unassigned', [
            'user_id' => $member->user_id,
            'project_id' => $member->project_id,
        ]);

        return response()->json(null, 204);
    }
}
