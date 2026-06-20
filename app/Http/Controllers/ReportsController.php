<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class ReportsController extends Controller
{
    public function index(Workspace $workspace, Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        $boardColumns = $project->boards()
            ->with(['columns' => fn ($q) => $q->orderBy('position')])
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get()
            ->flatMap(fn ($board) => $board->columns);

        $tasks = $project->tasks()
            ->whereNull('archived_at')
            ->with('assignees:id,name,avatar')
            ->get();

        $totalTasks = $tasks->count();
        $completedTasks = $tasks->filter(fn ($t) => ! is_null($t->completed_at))->count();

        $byStatus = $boardColumns->map(fn ($col) => [
            'key' => $col->status_key,
            'name' => $col->name,
            'color' => $col->color,
            'count' => $tasks->where('status', $col->status_key)->count(),
        ]);

        $overdueTasks = $tasks->filter(
            fn ($t) => is_null($t->completed_at) && $t->due_date && $t->due_date->isPast()
        )->count();

        $noDateTasks = $tasks->filter(
            fn ($t) => is_null($t->due_date)
        )->count();

        $completionRate = $totalTasks > 0
            ? round(($completedTasks / $totalTasks) * 100, 1)
            : 0;

        $assigneeWorkload = $project->members()
            ->with('user:id,name,avatar')
            ->get()
            ->map(fn ($member) => [
                'name' => $member->user->name,
                'avatar' => $member->user->avatar,
                'total' => $tasks->filter(
                    fn ($t) => $t->assignees->contains('id', $member->user_id)
                )->count(),
                'completed' => $tasks->filter(
                    fn ($t) => $t->assignees->contains('id', $member->user_id) && ! is_null($t->completed_at)
                )->count(),
            ])
            ->filter(fn ($item) => $item['total'] > 0)
            ->sortByDesc('total')
            ->values();

        $activeSprint = $project->sprints()
            ->where('status', 'active')
            ->first(['id', 'name', 'start_date', 'end_date']);

        $burndown = null;

        if ($activeSprint) {
            $sprintTasks = $project->tasks()
                ->whereHas('sprints', fn ($q) => $q->where('sprints.id', $activeSprint->id))
                ->whereNull('archived_at')
                ->get();

            $totalSprintTasks = $sprintTasks->count();
            $start = $activeSprint->start_date ? $activeSprint->start_date->copy() : now()->subDays(7);
            $end = $activeSprint->end_date ? $activeSprint->end_date->copy() : now()->addDays(7);
            $duration = max($start->diffInDays($end), 1);

            $points = [];
            $cursor = $start->copy();
            $maxIterations = 365;
            $iteration = 0;

            while ($cursor <= $end && $iteration < $maxIterations) {
                $iteration++;
                $remaining = $sprintTasks->filter(
                    fn ($t) => is_null($t->completed_at) || $t->completed_at->gt($cursor->endOfDay())
                )->count();

                $daysElapsed = max($start->diffInDays($cursor), 0);
                $ideal = max($totalSprintTasks - ($totalSprintTasks / $duration) * $daysElapsed, 0);

                $points[] = [
                    'date' => $cursor->format('Y-m-d'),
                    'remaining' => $remaining,
                    'ideal' => round($ideal, 1),
                ];

                $cursor->addDay();
            }

            $burndown = [
                'sprint' => [
                    'name' => $activeSprint->name,
                    'start_date' => $activeSprint->start_date?->format('Y-m-d'),
                    'end_date' => $activeSprint->end_date?->format('Y-m-d'),
                ],
                'data' => $points,
            ];
        }

        $completedSprints = $project->sprints()
            ->where('status', 'completed')
            ->withSum(['tasks as completed_story_points' => fn ($q) => $q->whereNotNull('tasks.completed_at')], 'tasks.story_points')
            ->orderBy('completed_at')
            ->get(['id', 'name', 'committed_points']);

        $velocity = $completedSprints->map(function ($sprint) {

            return [
                'name' => $sprint->name,
                'committed' => $sprint->committed_points,
                'completed' => (int) ($sprint->completed_story_points ?? 0),
            ];
        });

        $avgVelocity = $velocity->isNotEmpty()
            ? round($velocity->avg('completed'), 1)
            : 0;

        return response()->json([
            'summary' => [
                'total' => $totalTasks,
                'completed' => $completedTasks,
                'overdue' => $overdueTasks,
                'no_due_date' => $noDateTasks,
                'completion_rate' => $completionRate,
                'by_status' => $byStatus,
            ],
            'assignee_workload' => $assigneeWorkload,
            'burndown' => $burndown,
            'velocity' => [
                'sprints' => $velocity,
                'avg_velocity' => $avgVelocity,
            ],
        ]);
    }
}
