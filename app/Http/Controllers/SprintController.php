<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSprintRequest;
use App\Http\Requests\UpdateSprintRequest;
use App\Models\Project;
use App\Models\Sprint;
use App\Models\Task;
use App\Models\Workspace;
use App\Services\RealtimeGatewayService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SprintController extends Controller
{
    public function index(Workspace $workspace, Project $project): RedirectResponse
    {
        return redirect()->route('projects.show', [
            'workspace' => $workspace->slug,
            'project' => $project->slug,
            'tab' => 'sprints',
        ]);
    }

    public function show(Workspace $workspace, Project $project, Sprint $sprint): Response
    {
        Gate::authorize('view', $project);

        $this->ensureSprintBelongsToProject($sprint, $project);

        $sprint->loadCount('tasks');

        $sprint->load(['tasks' => function ($query) {
            $query->orderBy('status')
                ->orderBy('position')
                ->with(['priority:id,name,key,level,color', 'taskType:id,name,key,color', 'assignees:id,name,avatar', 'boardColumn:id,name,status_key,color']);
        }]);

        $completedCount = $sprint->tasks->filter(fn ($task) => $task->completed_at !== null)->count();

        $sprint->setRelation('tasks', $sprint->tasks->map(fn ($task) => [
            'id' => $task->id,
            'task_number' => $task->task_number,
            'code' => $task->code,
            'title' => $task->title,
            'status' => $task->status,
            'due_date' => $task->due_date,
            'completed_at' => $task->completed_at,
            'priority' => $task->priority,
            'task_type' => $task->taskType,
            'assignees' => $task->assignees,
            'board_column' => $task->boardColumn,
        ]));

        $availableTasks = $project->tasks()
            ->whereDoesntHave('sprints', fn ($q) => $q->where('sprint_id', $sprint->id))
            ->orderBy('code')
            ->get(['id', 'code', 'title']);

        return Inertia::render('projects/sprints/show', [
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
                'color' => $project->color,
            ],
            'sprint' => array_merge(
                $sprint->only('id', 'name', 'goal', 'status', 'start_date', 'end_date', 'committed_points', 'completed_at', 'tasks_count'),
                ['completed_tasks_count' => $completedCount],
            ),
            'sprintTasks' => $sprint->tasks,
            'availableTasks' => $availableTasks,
        ]);
    }

    public function addTask(Request $request, Workspace $workspace, Project $project, Sprint $sprint): RedirectResponse
    {
        Gate::authorize('update', $project);

        $this->ensureSprintBelongsToProject($sprint, $project);

        $validated = $request->validate([
            'task_id' => ['required', 'integer', 'exists:tasks,id'],
        ]);

        $sprint->tasks()->syncWithoutDetaching([$validated['task_id']]);

        $task = Task::find($validated['task_id']);
        if ($task) {
            app(RealtimeGatewayService::class)->broadcast("project.{$project->id}", 'task.field.updated', [
                'taskId' => $task->id,
                'changes' => [
                    'sprints' => $task->sprints()->get(['sprints.id', 'name', 'status', 'start_date', 'end_date'])->toArray(),
                ],
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Task added to sprint.']);

        return back();
    }

    public function removeTask(Request $request, Workspace $workspace, Project $project, Sprint $sprint): RedirectResponse
    {
        Gate::authorize('update', $project);

        $this->ensureSprintBelongsToProject($sprint, $project);

        $validated = $request->validate([
            'task_id' => ['required', 'integer', 'exists:tasks,id'],
        ]);

        $sprint->tasks()->detach($validated['task_id']);

        $task = Task::find($validated['task_id']);
        if ($task) {
            app(RealtimeGatewayService::class)->broadcast("project.{$project->id}", 'task.field.updated', [
                'taskId' => $task->id,
                'changes' => [
                    'sprints' => $task->sprints()->get(['sprints.id', 'name', 'status', 'start_date', 'end_date'])->toArray(),
                ],
            ]);
        }

        Inertia::flash('toast', ['type' => 'info', 'message' => 'Task removed from sprint.']);

        return back();
    }

    public function store(StoreSprintRequest $request, Workspace $workspace, Project $project): RedirectResponse
    {
        Gate::authorize('sprint.create');

        $validated = $request->validated();

        $project->sprints()->create([
            'name' => $validated['name'],
            'goal' => $validated['goal'] ?? null,
            'status' => $validated['status'] ?? 'planned',
            'is_backlog' => $validated['is_backlog'] ?? false,
            'start_date' => $validated['start_date'] ?? null,
            'end_date' => $validated['end_date'] ?? null,
            'completed_at' => ($validated['status'] ?? null) === 'completed' ? now() : null,
        ]);

        app(RealtimeGatewayService::class)->broadcast("project.{$project->id}", 'sprint.created', [
            'name' => $validated['name'],
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Sprint created.']);

        return back();
    }

    public function update(UpdateSprintRequest $request, Workspace $workspace, Project $project, Sprint $sprint): RedirectResponse
    {
        Gate::authorize('update', $project);

        $this->ensureSprintBelongsToProject($sprint, $project);

        $validated = $request->validated();
        $validated['completed_at'] = $validated['status'] === 'completed'
            ? ($sprint->completed_at ?? now())
            : null;

        $sprint->update($validated);

        app(RealtimeGatewayService::class)->broadcast("project.{$project->id}", 'sprint.updated', [
            'id' => $sprint->id,
            'name' => $sprint->name,
            'status' => $sprint->status,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Sprint updated.']);

        return back();
    }

    public function start(Workspace $workspace, Project $project, Sprint $sprint): RedirectResponse
    {
        Gate::authorize('update', $project);
        $this->ensureSprintBelongsToProject($sprint, $project);

        abort_if($sprint->status !== 'planned', 422, 'Only planned sprints can be started.');

        $activeExists = $project->sprints()->where('status', 'active')->exists();
        abort_if($activeExists, 422, 'Another sprint is already active. Complete it first.');

        $sprint->update([
            'status' => 'active',
            'start_date' => $sprint->start_date ?? now()->toDateString(),
        ]);

        app(RealtimeGatewayService::class)->broadcast("project.{$project->id}", 'sprint.updated', [
            'id' => $sprint->id,
            'name' => $sprint->name,
            'status' => $sprint->status,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Sprint started.']);

        return back();
    }

    public function close(Workspace $workspace, Project $project, Sprint $sprint): RedirectResponse
    {
        Gate::authorize('update', $project);
        $this->ensureSprintBelongsToProject($sprint, $project);

        abort_if($sprint->status !== 'active', 422, 'Only active sprints can be completed.');

        $sprint->update([
            'status' => 'completed',
            'completed_at' => $sprint->completed_at ?? now(),
            'end_date' => $sprint->end_date ?? now()->toDateString(),
        ]);

        app(RealtimeGatewayService::class)->broadcast("project.{$project->id}", 'sprint.updated', [
            'id' => $sprint->id,
            'name' => $sprint->name,
            'status' => $sprint->status,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Sprint completed.']);

        return back();
    }

    public function report(Workspace $workspace, Project $project, Sprint $sprint): Response
    {
        Gate::authorize('view', $project);
        $this->ensureSprintBelongsToProject($sprint, $project);

        $sprint->loadCount('tasks');
        $sprint->load(['tasks' => function ($query) {
            $query->with(['priority:id,name,key,level,color', 'taskType:id,name,key,color', 'assignees:id,name,avatar', 'boardColumn:id,name,status_key,color']);
        }]);

        $completedCount = $sprint->tasks->filter(fn ($task) => $task->completed_at !== null)->count();
        $completedPoints = $sprint->tasks->filter(fn ($t) => $t->completed_at !== null)->sum('story_points');
        $totalPoints = $sprint->tasks->sum('story_points');

        $burndown = $this->computeBurndown($sprint);

        $byStatus = $sprint->tasks->groupBy('status')->map(fn ($tasks, $key) => [
            'key' => $key,
            'count' => $tasks->count(),
        ])->values();

        $byAssignee = $sprint->tasks->flatMap(fn ($t) => $t->assignees->map(fn ($a) => $a->id))
            ->countBy()
            ->map(fn ($count, $userId) => [
                'user' => $sprint->tasks->flatMap(fn ($t) => $t->assignees)->firstWhere('id', $userId)?->only('id', 'name', 'avatar'),
                'total' => $sprint->tasks->filter(fn ($t) => $t->assignees->contains('id', $userId))->count(),
                'completed' => $sprint->tasks->filter(fn ($t) => $t->assignees->contains('id', $userId) && $t->completed_at !== null)->count(),
            ])->values();

        return Inertia::render('projects/sprints/report', [
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
            'sprint' => array_merge(
                $sprint->only('id', 'name', 'goal', 'status', 'start_date', 'end_date', 'committed_points', 'completed_at'),
                [
                    'tasks_count' => $sprint->tasks_count,
                    'completed_tasks_count' => $completedCount,
                    'total_points' => $totalPoints,
                    'completed_points' => $completedPoints,
                ],
            ),
            'burndown' => $burndown,
            'byStatus' => $byStatus,
            'byAssignee' => $byAssignee,
        ]);
    }

    private function computeBurndown(Sprint $sprint): array
    {
        $sprintTasks = $sprint->tasks;
        $totalTasks = $sprintTasks->count();

        if ($totalTasks === 0) {
            return ['data' => []];
        }

        $start = $sprint->start_date?->copy() ?? now()->subDays(7);
        $end = $sprint->end_date?->copy() ?? now()->addDays(7);
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
            $ideal = max($totalTasks - ($totalTasks / $duration) * $daysElapsed, 0);

            $points[] = [
                'date' => $cursor->format('Y-m-d'),
                'remaining' => $remaining,
                'ideal' => round($ideal, 1),
            ];

            $cursor->addDay();
        }

        return ['data' => $points];
    }

    public function destroy(Workspace $workspace, Project $project, Sprint $sprint): RedirectResponse
    {
        Gate::authorize('update', $project);

        $this->ensureSprintBelongsToProject($sprint, $project);
        $sprint->tasks()->detach();
        $sprint->delete();

        app(RealtimeGatewayService::class)->broadcast("project.{$project->id}", 'sprint.deleted', [
            'id' => $sprint->id,
        ]);

        Inertia::flash('toast', ['type' => 'info', 'message' => 'Sprint deleted.']);

        return back();
    }

    private function ensureSprintBelongsToProject(Sprint $sprint, Project $project): void
    {
        abort_unless((int) $sprint->project_id === (int) $project->id, 404);
    }
}
