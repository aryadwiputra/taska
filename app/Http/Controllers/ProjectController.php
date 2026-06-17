<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Models\Integration;
use App\Models\Project;
use App\Models\TaskActivity;
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

        $tasks = $project->tasks()
            ->with(['assignees:id,name,avatar', 'priority:id,name,key,level,color', 'taskType:id,name,key,color', 'boardColumn:id,name,status_key,color', 'labels:id,name,slug,color', 'epics:id,name,color,status', 'sprints:id,name,status,start_date,end_date'])
            ->latest('tasks.created_at')
            ->get()
            ->map(fn ($task) => [
                'id' => $task->id,
                'code' => $task->code,
                'title' => $task->title,
                'status' => $task->status,
                'start_date' => $task->start_date,
                'due_date' => $task->due_date,
                'created_at' => $task->created_at,
                'updated_at' => $task->updated_at,
                'priority' => $task->priority ? [
                    'id' => $task->priority->id,
                    'name' => $task->priority->name,
                    'key' => $task->priority->key,
                    'color' => $task->priority->color,
                ] : null,
                'task_type' => [
                    'id' => $task->taskType->id,
                    'name' => $task->taskType->name,
                    'key' => $task->taskType->key,
                    'color' => $task->taskType->color,
                ],
                'board_column' => [
                    'id' => $task->boardColumn->id,
                    'name' => $task->boardColumn->name,
                    'status_key' => $task->boardColumn->status_key,
                    'color' => $task->boardColumn->color,
                ],
                'assignees' => $task->assignees->map(fn ($user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'avatar' => $user->avatar,
                ]),
                'labels' => $task->labels->map(fn ($label) => [
                    'id' => $label->id,
                    'name' => $label->name,
                    'slug' => $label->slug,
                    'color' => $label->color,
                ]),
                'epics' => $task->epics->map(fn ($epic) => [
                    'id' => $epic->id,
                    'name' => $epic->name,
                    'color' => $epic->color,
                    'status' => $epic->status,
                ]),
                'sprints' => $task->sprints->map(fn ($sprint) => [
                    'id' => $sprint->id,
                    'name' => $sprint->name,
                    'status' => $sprint->status,
                    'start_date' => $sprint->start_date,
                    'end_date' => $sprint->end_date,
                ]),
            ]);

        $epics = $project->epics()
            ->withCount([
                'tasks',
                'tasks as completed_tasks_count' => fn ($query) => $query->whereNotNull('tasks.completed_at'),
            ])
            ->orderBy('name')
            ->get(['id', 'name', 'summary', 'color', 'start_date', 'due_date', 'status'])
            ->map(fn ($epic) => [
                'id' => $epic->id,
                'name' => $epic->name,
                'summary' => $epic->summary,
                'color' => $epic->color,
                'start_date' => $epic->start_date,
                'due_date' => $epic->due_date,
                'status' => $epic->status,
                'tasks_count' => $epic->tasks_count,
                'completed_tasks_count' => $epic->completed_tasks_count,
            ]);

        $sprints = $project->sprints()
            ->withCount([
                'tasks',
                'tasks as completed_tasks_count' => fn ($query) => $query->whereNotNull('tasks.completed_at'),
            ])
            ->orderByRaw("CASE status WHEN 'active' THEN 0 WHEN 'planned' THEN 1 WHEN 'completed' THEN 2 ELSE 3 END")
            ->orderByDesc('start_date')
            ->get(['id', 'name', 'goal', 'status', 'start_date', 'end_date', 'completed_at'])
            ->map(fn ($sprint) => [
                'id' => $sprint->id,
                'name' => $sprint->name,
                'goal' => $sprint->goal,
                'status' => $sprint->status,
                'start_date' => $sprint->start_date,
                'end_date' => $sprint->end_date,
                'completed_at' => $sprint->completed_at,
                'tasks_count' => $sprint->tasks_count,
                'completed_tasks_count' => $sprint->completed_tasks_count,
            ]);

        $labels = $project->labels()
            ->withCount('tasks')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'color'])
            ->map(fn ($label) => [
                'id' => $label->id,
                'name' => $label->name,
                'slug' => $label->slug,
                'color' => $label->color,
                'tasks_count' => $label->tasks_count,
            ]);

        $attachments = TaskAttachment::query()
            ->with(['task:id,project_id,code,title', 'uploader:id,name,avatar'])
            ->whereHas('task', fn ($query) => $query->where('project_id', $project->id))
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn ($attachment) => [
                'id' => $attachment->id,
                'file_name' => $attachment->file_name,
                'file_size' => $attachment->file_size,
                'mime_type' => $attachment->mime_type,
                'created_at' => $attachment->created_at,
                'task' => [
                    'id' => $attachment->task->id,
                    'code' => $attachment->task->code,
                    'title' => $attachment->task->title,
                ],
                'uploader' => [
                    'id' => $attachment->uploader->id,
                    'name' => $attachment->uploader->name,
                    'avatar' => $attachment->uploader->avatar,
                ],
            ]);

        $activities = TaskActivity::query()
            ->with(['task:id,project_id,code,title', 'user:id,name,avatar'])
            ->whereHas('task', fn ($query) => $query->where('project_id', $project->id))
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn ($activity) => [
                'id' => $activity->id,
                'action' => $activity->action,
                'field_name' => $activity->field_name,
                'old_value' => $activity->old_value,
                'new_value' => $activity->new_value,
                'created_at' => $activity->created_at,
                'task' => [
                    'id' => $activity->task->id,
                    'code' => $activity->task->code,
                    'title' => $activity->task->title,
                ],
                'user' => $activity->user ? [
                    'id' => $activity->user->id,
                    'name' => $activity->user->name,
                    'avatar' => $activity->user->avatar,
                ] : null,
            ]);

        $boardColumns = $project->boards()
            ->with(['columns' => fn ($query) => $query->orderBy('position')])
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get(['id', 'name', 'is_default'])
            ->flatMap(fn ($board) => $board->columns->map(fn ($column) => [
                'id' => $column->id,
                'name' => $column->name,
                'status_key' => $column->status_key,
                'color' => $column->color,
                'board' => [
                    'id' => $board->id,
                    'name' => $board->name,
                    'is_default' => $board->is_default,
                ],
            ]))
            ->values();

        $priorities = $workspace->priorities()
            ->orderBy('level')
            ->get(['id', 'name', 'key', 'level', 'color'])
            ->map(fn ($priority) => [
                'id' => $priority->id,
                'name' => $priority->name,
                'key' => $priority->key,
                'level' => $priority->level,
                'color' => $priority->color,
            ]);

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
            'members' => $members,
            'tasks' => $tasks,
            'epics' => $epics,
            'sprints' => $sprints,
            'labels' => $labels,
            'boardColumns' => $boardColumns,
            'priorities' => $priorities,
            'attachments' => $attachments,
            'activities' => $activities,
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
