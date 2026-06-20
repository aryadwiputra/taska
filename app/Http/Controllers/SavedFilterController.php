<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\SavedFilter;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class SavedFilterController extends Controller
{
    public function index(Workspace $workspace, Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        $userId = auth()->id();

        $filters = SavedFilter::where('project_id', $project->id)
            ->where(fn ($q) => $q->where('user_id', $userId)->orWhere('is_shared', true))
            ->orderBy('name')
            ->get(['id', 'name', 'filters', 'sort_field', 'sort_direction', 'is_shared', 'user_id']);

        return response()->json(['saved_filters' => $filters]);
    }

    public function store(Request $request, Workspace $workspace, Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'filters' => ['required', 'array'],
            'sort_field' => ['nullable', 'string', 'max:50'],
            'sort_direction' => ['nullable', 'string', 'in:asc,desc'],
            'is_shared' => ['nullable', 'boolean'],
        ]);

        $filter = $project->savedFilters()->create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'filters' => $validated['filters'],
            'sort_field' => $validated['sort_field'] ?? 'position',
            'sort_direction' => $validated['sort_direction'] ?? 'asc',
            'is_shared' => $validated['is_shared'] ?? false,
        ]);

        return response()->json([
            'id' => $filter->id,
            'name' => $filter->name,
            'filters' => $filter->filters,
            'sort_field' => $filter->sort_field,
            'sort_direction' => $filter->sort_direction,
            'is_shared' => $filter->is_shared,
        ], 201);
    }

    public function destroy(Workspace $workspace, Project $project, SavedFilter $savedFilter): JsonResponse
    {
        Gate::authorize('update', $project);

        abort_unless((int) $savedFilter->project_id === (int) $project->id, 404);
        abort_unless(
            (int) $savedFilter->user_id === (int) auth()->id() || auth()->user()->can('update', $project),
            403,
        );

        $savedFilter->delete();

        return response()->json(['ok' => true]);
    }
}
