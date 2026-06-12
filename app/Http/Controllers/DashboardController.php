<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user->workspaces()->count() === 0) {
            Inertia::flash('toast', ['type' => 'info', 'message' => 'Create your first workspace to get started.']);

            return to_route('workspaces.create');
        }

        return Inertia::render('dashboard', [
            'stats' => [
                'assigned' => $user->assignedTasks()->whereNull('completed_at')->count(),
                'overdue' => $user->assignedTasks()
                    ->whereNull('completed_at')
                    ->whereNotNull('due_date')
                    ->where('due_date', '<', now()->startOfDay())
                    ->count(),
                'activeProjects' => $user->projects()->where('status', 'active')->count(),
                'upcomingDeadlines' => $user->assignedTasks()
                    ->whereNull('completed_at')
                    ->whereNotNull('due_date')
                    ->whereBetween('due_date', [now()->startOfDay(), now()->addDays(7)->endOfDay()])
                    ->count(),
            ],
            'assignedTasks' => Inertia::defer(fn () => $user->assignedTasks()
                ->whereNull('completed_at')
                ->with(['project:id,name,key,color'])
                ->latest('tasks.created_at')
                ->limit(5)
                ->get()
                ->map(fn ($task) => [
                    'id' => $task->id,
                    'code' => $task->code,
                    'title' => $task->title,
                    'status' => $task->status,
                    'priority_id' => $task->priority_id,
                    'due_date' => $task->due_date,
                    'project' => $task->project ? [
                        'id' => $task->project->id,
                        'name' => $task->project->name,
                        'key' => $task->project->key,
                        'color' => $task->project->color,
                    ] : null,
                ])),
            'activeProjects' => Inertia::defer(fn () => $user->projects()
                ->where('status', 'active')
                ->withCount(['tasks' => fn ($q) => $q->whereNull('completed_at')])
                ->limit(5)
                ->get()
                ->map(fn ($project) => [
                    'id' => $project->id,
                    'name' => $project->name,
                    'key' => $project->key,
                    'color' => $project->color,
                    'tasks_count' => $project->tasks_count,
                ])),
            'upcomingDeadlines' => Inertia::defer(fn () => $user->assignedTasks()
                ->whereNull('completed_at')
                ->whereNotNull('due_date')
                ->whereBetween('due_date', [now()->startOfDay(), now()->addDays(7)->endOfDay()])
                ->with('project:id,name,key')
                ->orderBy('due_date')
                ->get()
                ->map(fn ($task) => [
                    'id' => $task->id,
                    'code' => $task->code,
                    'title' => $task->title,
                    'due_date' => $task->due_date,
                    'priority_id' => $task->priority_id,
                    'project' => $task->project ? [
                        'id' => $task->project->id,
                        'name' => $task->project->name,
                        'key' => $task->project->key,
                    ] : null,
                ])),
            'recentActivity' => Inertia::defer(fn () => ActivityLog::query()
                ->where('user_id', $user->id)
                ->latest()
                ->limit(10)
                ->get()
                ->map(fn ($log) => [
                    'id' => $log->id,
                    'action' => $log->action,
                    'description' => $log->description,
                    'created_at' => $log->created_at,
                ])),
        ]);
    }
}
