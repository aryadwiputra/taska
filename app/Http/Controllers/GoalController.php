<?php

namespace App\Http\Controllers;

use App\Models\Epic;
use App\Models\Goal;
use App\Models\KeyResult;
use App\Models\Workspace;
use App\Support\Rbac;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class GoalController extends Controller
{
    public function index(Workspace $workspace): Response
    {
        Gate::authorize('view', $workspace);

        $goals = $workspace->goals()
            ->with(['keyResults', 'epics'])
            ->get()
            ->map(fn (Goal $goal) => [
                'id' => $goal->id,
                'title' => $goal->title,
                'description' => $goal->description,
                'status' => $goal->status,
                'target_date' => $goal->target_date?->format('Y-m-d'),
                'progress' => $goal->progress,
                'key_results_count' => $goal->keyResults->count(),
                'epics_count' => $goal->epics->count(),
                'created_at' => $goal->created_at,
            ]);

        return Inertia::render('workspaces/goals/index', [
            'workspace' => [
                'id' => $workspace->id,
                'name' => $workspace->name,
                'slug' => $workspace->slug,
            ],
            'goals' => $goals,
        ]);
    }

    public function store(Request $request, Workspace $workspace): JsonResponse
    {
        if (! Rbac::userCanInWorkspace($request->user(), $workspace, 'project.create')) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'target_date' => 'nullable|date',
        ]);

        $goal = $workspace->goals()->create($validated);

        return response()->json([
            'id' => $goal->id,
            'title' => $goal->title,
            'description' => $goal->description,
            'status' => $goal->status,
            'target_date' => $goal->target_date?->format('Y-m-d'),
            'progress' => 0,
            'key_results_count' => 0,
            'epics_count' => 0,
            'created_at' => $goal->created_at,
        ]);
    }

    public function show(Workspace $workspace, Goal $goal): Response
    {
        Gate::authorize('view', $workspace);

        $goal->load(['keyResults', 'epics']);

        return Inertia::render('workspaces/goals/show', [
            'workspace' => [
                'id' => $workspace->id,
                'name' => $workspace->name,
                'slug' => $workspace->slug,
            ],
            'goal' => [
                'id' => $goal->id,
                'title' => $goal->title,
                'description' => $goal->description,
                'status' => $goal->status,
                'target_date' => $goal->target_date?->format('Y-m-d'),
                'progress' => $goal->progress,
                'key_results' => $goal->keyResults->map(fn (KeyResult $kr) => [
                    'id' => $kr->id,
                    'title' => $kr->title,
                    'status' => $kr->status,
                    'current_value' => $kr->current_value,
                    'target_value' => $kr->target_value,
                    'progress' => $kr->progress,
                ]),
                'epics' => $goal->epics->map(fn (Epic $epic) => [
                    'id' => $epic->id,
                    'name' => $epic->name,
                    'color' => $epic->color,
                    'status' => $epic->status,
                    'project' => [
                        'id' => $epic->project->id,
                        'name' => $epic->project->name,
                        'key' => $epic->project->key,
                    ],
                ]),
            ],
        ]);
    }

    public function update(Request $request, Workspace $workspace, Goal $goal): JsonResponse
    {
        Gate::authorize('view', $workspace);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:active,completed,cancelled',
            'target_date' => 'nullable|date',
        ]);

        $goal->update($validated);

        return response()->json([
            'id' => $goal->id,
            'title' => $goal->title,
            'description' => $goal->description,
            'status' => $goal->status,
            'target_date' => $goal->target_date?->format('Y-m-d'),
            'progress' => $goal->progress,
        ]);
    }

    public function destroy(Workspace $workspace, Goal $goal): JsonResponse
    {
        if (! Rbac::userCanInWorkspace(request()->user(), $workspace, 'workspace.edit')) {
            abort(403);
        }

        $goal->delete();

        return response()->json(['message' => 'Goal deleted.']);
    }

    public function storeKeyResult(Request $request, Workspace $workspace, Goal $goal): JsonResponse
    {
        Gate::authorize('view', $workspace);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'target_value' => 'required|numeric|min:0',
        ]);

        $keyResult = $goal->keyResults()->create($validated);

        return response()->json([
            'id' => $keyResult->id,
            'title' => $keyResult->title,
            'status' => $keyResult->status,
            'current_value' => $keyResult->current_value,
            'target_value' => $keyResult->target_value,
            'progress' => $keyResult->progress,
        ]);
    }

    public function updateKeyResult(Request $request, Workspace $workspace, Goal $goal, KeyResult $keyResult): JsonResponse
    {
        Gate::authorize('view', $workspace);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'status' => 'sometimes|in:not_started,in_progress,achieved',
            'current_value' => 'sometimes|numeric|min:0',
            'target_value' => 'sometimes|numeric|min:0',
        ]);

        $keyResult->update($validated);

        return response()->json([
            'id' => $keyResult->id,
            'title' => $keyResult->title,
            'status' => $keyResult->status,
            'current_value' => $keyResult->current_value,
            'target_value' => $keyResult->target_value,
            'progress' => $keyResult->progress,
        ]);
    }

    public function destroyKeyResult(Workspace $workspace, Goal $goal, KeyResult $keyResult): JsonResponse
    {
        Gate::authorize('view', $workspace);

        $keyResult->delete();

        return response()->json(['message' => 'Key result deleted.']);
    }

    public function addEpic(Request $request, Workspace $workspace, Goal $goal): JsonResponse
    {
        Gate::authorize('view', $workspace);

        $validated = $request->validate([
            'epic_id' => 'required|exists:epics,id',
        ]);

        $epic = Epic::findOrFail($validated['epic_id']);

        if ($goal->epics()->where('epic_id', $epic->id)->exists()) {
            return response()->json(['message' => 'Epic already linked.'], 422);
        }

        $goal->epics()->attach($epic);

        return response()->json([
            'id' => $epic->id,
            'name' => $epic->name,
            'color' => $epic->color,
            'status' => $epic->status,
            'project' => [
                'id' => $epic->project->id,
                'name' => $epic->project->name,
                'key' => $epic->project->key,
            ],
        ]);
    }

    public function removeEpic(Workspace $workspace, Goal $goal, Epic $epic): JsonResponse
    {
        Gate::authorize('view', $workspace);

        $goal->epics()->detach($epic);

        return response()->json(['message' => 'Epic removed.']);
    }
}
