<?php

namespace App\Http\Controllers;

use App\Models\ApprovalFlow;
use App\Models\Project;
use App\Models\Task;
use App\Models\Workspace;
use App\Support\Rbac;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ApprovalFlowController extends Controller
{
    public function index(Workspace $workspace, Project $project): Response
    {
        Gate::authorize('viewAny', [ApprovalFlow::class, $project]);

        $flows = $project->approvalFlows()
            ->with('column')
            ->get();

        return Inertia::render('projects/settings/approvals', [
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
            'flows' => $flows,
            'options' => [
                'columns' => $project->boards()
                    ->where('is_default', true)
                    ->first()
                    ?->columns()
                    ->orderBy('position')
                    ->get(['id', 'name', 'status_key', 'color']) ?? collect(),
                'members' => $project->members()
                    ->with('user:id,name,avatar')
                    ->get()
                    ->map(fn ($m) => [
                        'id' => $m->user->id,
                        'name' => $m->user->name,
                        'avatar' => $m->user->avatar,
                    ]),
                'roles' => collect(Rbac::WORKSPACE_ROLES)
                    ->map(fn ($name) => ['value' => $name, 'label' => ucfirst($name)])
                    ->values(),
            ],
        ]);
    }

    public function store(Request $request, Workspace $workspace, Project $project): JsonResponse
    {
        Gate::authorize('create', [ApprovalFlow::class, $project]);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'column_id' => 'required|exists:board_columns,id',
            'required_approvers' => 'required|array|min:1',
            'required_approvers.*.type' => 'required|in:user,role',
            'required_approvers.*.value' => 'required|string',
            'min_approvals' => 'required|integer|min:1',
        ]);

        $flow = $project->approvalFlows()->create($validated);

        return response()->json($flow);
    }

    public function update(Request $request, Workspace $workspace, Project $project, ApprovalFlow $flow): JsonResponse
    {
        Gate::authorize('update', $flow);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'column_id' => 'sometimes|exists:board_columns,id',
            'required_approvers' => 'sometimes|array|min:1',
            'required_approvers.*.type' => 'required|in:user,role',
            'required_approvers.*.value' => 'required|string',
            'min_approvals' => 'sometimes|integer|min:1',
            'enabled' => 'sometimes|boolean',
        ]);

        $flow->update($validated);

        return response()->json($flow);
    }

    public function destroy(Workspace $workspace, Project $project, ApprovalFlow $flow): JsonResponse
    {
        Gate::authorize('delete', $flow);

        $flow->delete();

        return response()->json(['message' => 'Approval flow deleted.']);
    }

    public function approve(Workspace $workspace, Project $project, Task $task): JsonResponse
    {
        Gate::authorize('view', $task);

        $userId = request()->user()->id;

        $pendingApproval = $task->approvals()
            ->where('approver_id', $userId)
            ->where('status', 'pending')
            ->first();

        if (! $pendingApproval) {
            return response()->json(['error' => 'No pending approval found.'], 422);
        }

        $pendingApproval->update([
            'status' => 'approved',
            'comment' => request()->input('comment'),
        ]);

        return response()->json(['message' => 'Approved.']);
    }

    public function reject(Workspace $workspace, Project $project, Task $task): JsonResponse
    {
        Gate::authorize('view', $task);

        $userId = request()->user()->id;

        $pendingApproval = $task->approvals()
            ->where('approver_id', $userId)
            ->where('status', 'pending')
            ->first();

        if (! $pendingApproval) {
            return response()->json(['error' => 'No pending approval found.'], 422);
        }

        $pendingApproval->update([
            'status' => 'rejected',
            'comment' => request()->input('comment'),
        ]);

        return response()->json(['message' => 'Rejected.']);
    }
}
