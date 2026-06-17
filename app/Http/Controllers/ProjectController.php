<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Models\Integration;
use App\Models\Project;
use App\Models\TaskAttachment;
use App\Models\Workspace;
use App\Services\SettingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function index(Workspace $workspace): Response
    {
        Gate::authorize('view', $workspace);

        $projects = $workspace->projects()
            ->withCount(['tasks' => fn ($q) => $q->whereNull('completed_at')])
            ->withCount('members')
            ->get()
            ->map(fn ($project) => [
                'id' => $project->id,
                'name' => $project->name,
                'key' => $project->key,
                'slug' => $project->slug,
                'description' => $project->description,
                'color' => $project->color,
                'visibility' => $project->visibility,
                'status' => $project->status,
                'tasks_count' => $project->tasks_count,
                'members_count' => $project->members_count,
                'deleted_at' => $project->deleted_at,
            ]);

        return Inertia::render('projects/index', [
            'workspace' => [
                'id' => $workspace->id,
                'name' => $workspace->name,
                'slug' => $workspace->slug,
            ],
            'projects' => $projects,
        ]);
    }

    public function create(Workspace $workspace): Response
    {
        Gate::authorize('create', [Project::class, $workspace]);

        return Inertia::render('projects/create', [
            'workspace' => [
                'id' => $workspace->id,
                'name' => $workspace->name,
                'slug' => $workspace->slug,
            ],
        ]);
    }

    public function store(StoreProjectRequest $request, Workspace $workspace): RedirectResponse
    {
        $project = $workspace->projects()->create([
            'created_by' => $request->user()->id,
            'name' => $request->validated('name'),
            'key' => $request->validated('key'),
            'slug' => $request->validated('slug'),
            'description' => $request->validated('description'),
            'visibility' => $request->validated('visibility', 'private'),
            'color' => $request->validated('color'),
        ]);

        $project->members()->create([
            'user_id' => $request->user()->id,
            'role' => 'lead',
        ]);

        $board = $project->boards()->create([
            'name' => 'Board',
            'type' => 'kanban',
            'is_default' => true,
        ]);

        $defaultColumns = [
            ['name' => 'Backlog', 'status_key' => 'backlog', 'color' => '#6B7280', 'position' => 0],
            ['name' => 'Todo', 'status_key' => 'todo', 'color' => '#475569', 'position' => 1],
            ['name' => 'In Progress', 'status_key' => 'in_progress', 'color' => '#2563EB', 'position' => 2],
            ['name' => 'Review', 'status_key' => 'review', 'color' => '#D97706', 'position' => 3],
            ['name' => 'Done', 'status_key' => 'done', 'color' => '#16A34A', 'position' => 4, 'is_done_column' => true],
        ];

        foreach ($defaultColumns as $column) {
            $board->columns()->create($column);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Project created.']);

        return to_route('projects.show', [$workspace, $project]);
    }

    public function show(Workspace $workspace, Project $project): Response
    {
        Gate::authorize('view', $project);

        $counts = [
            'tasks' => $project->tasks()->count(),
            'epics' => $project->epics()->count(),
            'sprints' => $project->sprints()->count(),
            'labels' => $project->labels()->count(),
            'members' => $project->members()->count(),
            'components' => $project->components()->count(),
            'releases' => $project->releases()->count(),
            'automation_rules' => $project->automationRules()->count(),
            'attachments' => TaskAttachment::whereHas('task', fn ($q) => $q->where('project_id', $project->id))->count(),
        ];

        $defaultBoard = $project->boards()->where('is_default', true)->first();
        $columnsCount = $defaultBoard ? $defaultBoard->columns()->count() : 0;

        return Inertia::render('projects/show', [
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
                'description' => $project->description,
                'color' => $project->color,
                'visibility' => $project->visibility,
                'status' => $project->status,
            ],
            'counts' => $counts,
            'columnsCount' => $columnsCount,
        ]);
    }

    public function edit(Workspace $workspace, Project $project, SettingService $settings): Response
    {
        Gate::authorize('update', $project);

        $members = $project->members()
            ->with('user:id,name,email,avatar')
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'user_id' => $m->user_id,
                'name' => $m->user->name,
                'email' => $m->user->email,
                'avatar' => $m->user->avatar,
                'role' => $m->role,
            ]);

        $labels = $project->labels()
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'color']);

        $epics = $project->epics()
            ->withCount('tasks')
            ->orderBy('name')
            ->get(['id', 'name', 'summary', 'color', 'start_date', 'due_date', 'status']);

        $sprints = $project->sprints()
            ->withCount('tasks')
            ->orderByRaw("CASE status WHEN 'active' THEN 0 WHEN 'planned' THEN 1 WHEN 'completed' THEN 2 ELSE 3 END")
            ->orderByDesc('start_date')
            ->get(['id', 'name', 'goal', 'status', 'start_date', 'end_date', 'completed_at']);

        $boards = $project->boards()->with('columns:id,board_id,name,color,position,is_done_column,status_key')->get(['id', 'name', 'type']);

        return Inertia::render('projects/settings', [
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
                'description' => $project->description,
                'color' => $project->color,
                'visibility' => $project->visibility,
                'status' => $project->status,
                'deleted_at' => $project->deleted_at,
            ],
            'members' => $members,
            'labels' => $labels,
            'epics' => $epics,
            'sprints' => $sprints,
            'settings' => $settings->all($project),
            'boards' => $boards,
            'integration' => Integration::where('project_id', $project->id)
                ->where('provider', 'github')
                ->first(['provider_user_id', 'metadata']),
        ]);
    }

    public function update(UpdateProjectRequest $request, Workspace $workspace, Project $project): RedirectResponse
    {
        $project->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Project updated.']);

        return back();
    }

    public function destroy(Workspace $workspace, Project $project): RedirectResponse
    {
        Gate::authorize('delete', $project);

        $project->delete();

        Inertia::flash('toast', ['type' => 'info', 'message' => 'Project archived.']);

        return to_route('projects.index', $workspace);
    }

    public function restore(Workspace $workspace, string $project): RedirectResponse
    {
        $project = Project::withTrashed()
            ->where('workspace_id', $workspace->id)
            ->where(fn ($query) => $query->where('id', $project)->orWhere('slug', $project))
            ->firstOrFail();

        Gate::authorize('restore', $project);

        $project->restore();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Project restored.']);

        return back();
    }
}
