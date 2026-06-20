<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Workspace;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class WorkloadController extends Controller
{
    public function index(Workspace $workspace, Project $project): Response
    {
        Gate::authorize('view', $project);

        $members = $project->members()
            ->with('user:id,name,avatar')
            ->get();

        $allTasks = $project->tasks()
            ->with(['assignees:id', 'sprints:id,name,status'])
            ->whereNull('archived_at')
            ->get();

        $allSprints = $project->sprints()
            ->get(['id', 'name', 'status']);

        $members = $members->map(function ($member) use ($allTasks, $allSprints) {
            $tasks = $allTasks->filter(
                fn ($t) => $t->assignees->contains('id', $member->user_id)
            );

            $totalStoryPoints = $tasks->sum('story_points');
            $completedStoryPoints = $tasks->filter(fn ($t) => $t->completed_at !== null)->sum('story_points');

            $bySprint = $tasks->flatMap(fn ($t) => $t->sprints->map(fn ($s) => $s->id))
                ->countBy()
                ->map(function ($count, $sprintId) use ($tasks, $allSprints) {
                    $sprint = $allSprints->firstWhere('id', (int) $sprintId);
                    $sprintTasks = $tasks->filter(fn ($t) => $t->sprints->contains('id', (int) $sprintId));

                    return [
                        'id' => $sprintId,
                        'name' => $sprint?->name ?? 'Unknown',
                        'status' => $sprint?->status ?? 'unknown',
                        'total' => $sprintTasks->count(),
                        'completed' => $sprintTasks->filter(fn ($t) => $t->completed_at !== null)->count(),
                        'story_points' => $sprintTasks->sum('story_points'),
                    ];
                })
                ->values();

            $unscheduledTasks = $tasks->filter(fn ($t) => $t->sprints->isEmpty());

            return [
                'id' => $member->user->id,
                'name' => $member->user->name,
                'avatar' => $member->user->avatar,
                'capacity_hours' => $member->capacity_hours,
                'total_tasks' => $tasks->count(),
                'completed_tasks' => $tasks->filter(fn ($t) => $t->completed_at !== null)->count(),
                'total_story_points' => $totalStoryPoints,
                'completed_story_points' => $completedStoryPoints,
                'by_sprint' => $bySprint,
                'unscheduled_count' => $unscheduledTasks->count(),
            ];
        })
            ->sortByDesc('total_tasks')
            ->values();

        $sprints = $project->sprints()
            ->where('status', '!=', 'completed')
            ->orderByRaw("CASE status WHEN 'active' THEN 0 ELSE 1 END")
            ->orderByDesc('start_date')
            ->get(['id', 'name', 'status', 'committed_points']);

        return Inertia::render('projects/workload', [
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
            'members' => $members,
            'sprints' => $sprints,
        ]);
    }

    public function updateCapacity(Request $request, Workspace $workspace, Project $project): RedirectResponse
    {
        Gate::authorize('update', $project);

        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'capacity_hours' => ['nullable', 'integer', 'min:0'],
        ]);

        $project->members()
            ->where('user_id', $validated['user_id'])
            ->update(['capacity_hours' => $validated['capacity_hours']]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Capacity updated.']);

        return back();
    }
}
