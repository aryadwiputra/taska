<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLabelRequest;
use App\Http\Requests\UpdateLabelRequest;
use App\Models\Label;
use App\Models\Project;
use App\Models\Workspace;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class LabelController extends Controller
{
    public function index(Workspace $workspace, Project $project): Response
    {
        Gate::authorize('view', $project);

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

        return Inertia::render('projects/labels/index', [
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
            'labels' => $labels,
        ]);
    }

    public function show(Workspace $workspace, Project $project, Label $label): Response
    {
        Gate::authorize('view', $project);

        $this->ensureLabelBelongsToProject($label, $project);

        $label->loadCount('tasks');

        $label->load(['tasks' => function ($query) {
            $query->orderBy('status')
                ->orderBy('position')
                ->with(['priority:id,name,key,level,color', 'taskType:id,name,key,color', 'assignees:id,name,avatar', 'boardColumn:id,name,status_key,color']);
        }]);

        $label->setRelation('tasks', $label->tasks->map(fn ($task) => [
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

        return Inertia::render('projects/labels/show', [
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
            'label' => $label->only('id', 'name', 'slug', 'color', 'tasks_count'),
            'labelTasks' => $label->tasks,
        ]);
    }

    public function store(StoreLabelRequest $request, Workspace $workspace, Project $project): RedirectResponse
    {
        $validated = $request->validated();

        $project->labels()->create([
            'workspace_id' => $workspace->id,
            'name' => $validated['name'],
            'slug' => $this->uniqueSlug($workspace, $project, $validated['name']),
            'color' => $validated['color'] ?? null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Label created.']);

        return back();
    }

    public function update(UpdateLabelRequest $request, Workspace $workspace, Project $project, Label $label): RedirectResponse
    {
        $this->ensureLabelBelongsToProject($label, $project);

        $validated = $request->validated();

        $label->update([
            'name' => $validated['name'],
            'slug' => $this->uniqueSlug($workspace, $project, $validated['name'], $label),
            'color' => $validated['color'] ?? null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Label updated.']);

        return back();
    }

    public function destroy(Workspace $workspace, Project $project, Label $label): RedirectResponse
    {
        Gate::authorize('update', $project);

        $this->ensureLabelBelongsToProject($label, $project);

        $label->tasks()->detach();
        $label->delete();

        Inertia::flash('toast', ['type' => 'info', 'message' => 'Label deleted.']);

        return back();
    }

    private function uniqueSlug(Workspace $workspace, Project $project, string $name, ?Label $ignore = null): string
    {
        $baseSlug = Str::slug($name) ?: 'label';
        $slug = $baseSlug;
        $suffix = 2;

        while ($project->labels()
            ->where('workspace_id', $workspace->id)
            ->where('slug', $slug)
            ->when($ignore, fn ($query) => $query->whereKeyNot($ignore->id))
            ->exists()) {
            $slug = $baseSlug.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }

    private function ensureLabelBelongsToProject(Label $label, Project $project): void
    {
        abort_unless((int) $label->project_id === (int) $project->id, 404);
    }
}
