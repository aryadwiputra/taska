<?php

namespace App\Http\Controllers;

use App\Events\TaskFieldUpdated;
use App\Events\TaskMoved;
use App\Http\Requests\MoveTaskColumnRequest;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Models\BoardColumn;
use App\Models\Project;
use App\Models\Task;
use App\Models\Workspace;
use App\Services\NotificationService;
use App\Services\TaskActivityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function show(Request $request, Workspace $workspace, Project $project, Task $task): JsonResponse|Response
    {
        Gate::authorize('view', $task);

        $task->load([
            'assignees:id,name,avatar,email',
            'priority:id,name,key,level,color',
            'taskType:id,name,key,color',
            'reporter:id,name,avatar',
            'labels:id,name,slug,color',
            'epics:id,name,color,status',
            'sprints:id,name,status,start_date,end_date',
            'boardColumn:id,name,status_key,color',
            'watchers:id,name,avatar',
            'children:id,code,title,completed_at,priority_id',
            'children.priority:id,name,key,level,color',
            'parent:id,code,title',
            'relatedTasks.relatedTask:id,code,title',
        ]);

        $comments = $task->comments()
            ->with([
                'user:id,name,avatar',
                'replies.user:id,name,avatar',
                'mentions.user:id,name',
            ])
            ->whereNull('parent_id')
            ->latest()
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'body' => $c->body,
                'created_at' => $c->created_at,
                'edited_at' => $c->edited_at,
                'user' => ['id' => $c->user->id, 'name' => $c->user->name, 'avatar' => $c->user->avatar],
                'mentions' => $c->mentions->map(fn ($m) => [
                    'user_id' => $m->user_id,
                    'user_name' => $m->user->name,
                    'mentioned_text' => $m->mentioned_text,
                ]),
                'replies' => $c->replies->map(fn ($r) => [
                    'id' => $r->id,
                    'body' => $r->body,
                    'created_at' => $r->created_at,
                    'user' => ['id' => $r->user->id, 'name' => $r->user->name, 'avatar' => $r->user->avatar],
                ]),
            ]);

        $activities = $task->activities()
            ->with('user:id,name,avatar')
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'action' => $a->action,
                'field_name' => $a->field_name,
                'old_value' => $a->old_value,
                'new_value' => $a->new_value,
                'created_at' => $a->created_at,
                'user' => $a->user ? ['id' => $a->user->id, 'name' => $a->user->name, 'avatar' => $a->user->avatar] : null,
            ]);

        $attachments = $task->attachments()
            ->with('uploader:id,name,avatar')
            ->latest()
            ->get()
            ->map(fn ($attachment) => [
                'id' => $attachment->id,
                'file_name' => $attachment->file_name,
                'file_size' => $attachment->file_size,
                'mime_type' => $attachment->mime_type,
                'is_previewable' => $attachment->isPreviewable(),
                'is_image' => $attachment->isImage(),
                'is_pdf' => $attachment->isPdf(),
                'url' => route('projects.tasks.attachments.preview', [$workspace, $project, $task, $attachment]),
                'download_url' => route('projects.tasks.attachments.download', [$workspace, $project, $task, $attachment]),
                'created_at' => $attachment->created_at,
                'uploader' => [
                    'id' => $attachment->uploader->id,
                    'name' => $attachment->uploader->name,
                    'avatar' => $attachment->uploader->avatar,
                ],
            ]);

        $boardColumns = $project->boards()
            ->where('id', $task->board_id)
            ->first()
            ?->columns()
            ->orderBy('position')
            ->get(['id', 'name', 'status_key', 'color']) ?? collect();

        $projectMembers = $project->members()
            ->with('user:id,name,avatar,email')
            ->get()
            ->map(fn ($member) => [
                'id' => $member->user->id,
                'name' => $member->user->name,
                'avatar' => $member->user->avatar,
                'email' => $member->user->email,
            ]);

        $availableParentTasks = $project->tasks()
            ->whereKeyNot($task->id)
            ->whereNull('parent_id')
            ->whereNull('completed_at')
            ->orderBy('code')
            ->get(['id', 'code', 'title']);

        $children = $task->children->map(fn ($child) => [
            'id' => $child->id,
            'code' => $child->code,
            'title' => $child->title,
            'completed_at' => $child->completed_at,
            'priority' => $child->priority?->only('id', 'name', 'key', 'level', 'color'),
        ]);

        $relations = $task->relatedTasks->map(fn ($r) => [
            'id' => $r->id,
            'type' => $r->relation_type,
            'related_task' => [
                'id' => $r->relatedTask->id,
                'code' => $r->relatedTask->code,
                'title' => $r->relatedTask->title,
            ],
        ]);

        $taskData = [
            'task' => [
                'id' => $task->id,
                'task_number' => $task->task_number,
                'code' => $task->code,
                'title' => $task->title,
                'description' => $task->description,
                'status' => $task->status,
                'due_date' => $task->due_date,
                'start_date' => $task->start_date,
                'story_points' => $task->story_points,
                'completed_at' => $task->completed_at,
                'parent_id' => $task->parent_id,
                'project_id' => $task->project_id,
                'created_at' => $task->created_at,
                'updated_at' => $task->updated_at,
                'priority' => $task->priority,
                'task_type' => $task->taskType,
                'reporter' => $task->reporter,
                'assignees' => $task->assignees,
                'labels' => $task->labels,
                'epics' => $task->epics,
                'sprints' => $task->sprints,
                'board_column' => $task->boardColumn,
                'watchers' => $task->watchers,
                'watcher_count' => $task->watchers->count(),
                'children' => $children,
                'parent' => $task->parent?->only('id', 'code', 'title'),
                'relations' => $relations,
            ],
            'comments' => $comments,
            'attachments' => $attachments,
            'activities' => $activities,
            'options' => [
                'assignees' => $projectMembers,
                'labels' => $project->labels()->orderBy('name')->get(['id', 'name', 'slug', 'color']),
                'epics' => $project->epics()->orderBy('name')->get(['id', 'name', 'color', 'status']),
                'sprints' => $project->sprints()->orderByRaw("CASE status WHEN 'active' THEN 0 WHEN 'planned' THEN 1 WHEN 'completed' THEN 2 ELSE 3 END")->orderByDesc('start_date')->get(['id', 'name', 'status', 'start_date', 'end_date']),
                'priorities' => $workspace->priorities()->orderBy('level')->get(['id', 'name', 'key', 'level', 'color']),
                'task_types' => $workspace->taskTypes()->orderBy('name')->get(['id', 'name', 'key', 'color']),
                'board_columns' => $boardColumns,
                'available_parent_tasks' => $availableParentTasks,
                'project_tasks' => $project->tasks()->orderBy('code')->get(['id', 'code', 'title']),
            ],
        ];

        if ($request->expectsJson()) {
            return response()->json($taskData);
        }

        return Inertia::render('projects/tasks/show', [
            ...$taskData,
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
        ]);
    }

    public function store(StoreTaskRequest $request, Workspace $workspace, Project $project, TaskActivityService $activity): RedirectResponse
    {
        $validated = $request->validated();

        $board = $project->boards()->where('is_default', true)->first();

        $firstColumn = $board?->columns()->orderBy('position')->first();

        $taskNumber = $project->tasks()->withTrashed()->max('task_number') + 1;

        $task = $project->tasks()->create([
            'board_id' => $board?->id,
            'board_column_id' => $firstColumn?->id,
            'task_type_id' => $validated['task_type_id'],
            'priority_id' => $validated['priority_id'] ?? null,
            'reporter_id' => $request->user()->id,
            'task_number' => $taskNumber,
            'code' => $project->key.'-'.$taskNumber,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'parent_id' => $validated['parent_id'] ?? null,
            'start_date' => $validated['start_date'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'status' => $firstColumn?->status_key ?? 'todo',
            'position' => 0,
        ]);

        if (! empty($validated['assignee_ids'])) {
            $task->assignees()->attach($validated['assignee_ids']);
        }

        if (! empty($validated['epic_ids'])) {
            $task->epics()->attach($validated['epic_ids']);
        }

        if (! empty($validated['sprint_ids'])) {
            $task->sprints()->attach($validated['sprint_ids']);
        }

        $activity->created($task, $request->user());
        $activity->updated(
            $task->refresh(),
            $request->user(),
            [],
            [],
            array_map('intval', $validated['assignee_ids'] ?? []),
            [],
            array_map('intval', $validated['epic_ids'] ?? []),
            [],
            array_map('intval', $validated['sprint_ids'] ?? []),
            [],
            [],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Task created.']);

        return back();
    }

    public function update(UpdateTaskRequest $request, Workspace $workspace, Project $project, Task $task, TaskActivityService $activity, NotificationService $notifications): RedirectResponse
    {
        $validated = $request->validated();
        $before = $task->only([
            'title',
            'description',
            'task_type_id',
            'priority_id',
            'board_column_id',
            'story_points',
            'start_date',
            'due_date',
            'parent_id',
        ]);
        $oldAssigneeIds = $task->assignees()->pluck('users.id')->map(fn ($id) => (int) $id)->all();
        $oldEpicIds = $task->epics()->pluck('epics.id')->map(fn ($id) => (int) $id)->all();
        $oldSprintIds = $task->sprints()->pluck('sprints.id')->map(fn ($id) => (int) $id)->all();
        $oldWatcherIds = $task->watchers()->pluck('users.id')->map(fn ($id) => (int) $id)->all();

        if (array_key_exists('board_column_id', $validated)) {
            $column = BoardColumn::findOrFail($validated['board_column_id']);
            $validated['status'] = $column->status_key;
        }

        $task->update(Arr::except($validated, ['assignee_ids', 'label_ids', 'epic_ids', 'sprint_ids', 'watcher_ids', 'relation_updates']));

        if (array_key_exists('assignee_ids', $validated)) {
            $task->assignees()->sync($validated['assignee_ids'] ?? []);
        }

        if (array_key_exists('label_ids', $validated)) {
            $task->labels()->sync($validated['label_ids'] ?? []);
        }

        if (array_key_exists('epic_ids', $validated)) {
            $task->epics()->sync($validated['epic_ids'] ?? []);
        }

        if (array_key_exists('sprint_ids', $validated)) {
            $task->sprints()->sync($validated['sprint_ids'] ?? []);
        }

        if (array_key_exists('watcher_ids', $validated)) {
            $task->watchers()->sync($validated['watcher_ids'] ?? []);
        }

        if (array_key_exists('relation_updates', $validated) && is_array($validated['relation_updates'])) {
            $task->relatedTasks()->delete();

            foreach ($validated['relation_updates'] as $rel) {
                $task->relatedTasks()->create([
                    'related_task_id' => $rel['id'],
                    'relation_type' => $rel['relation_type'],
                ]);
            }
        }

        $newAssigneeIds = array_key_exists('assignee_ids', $validated)
            ? array_map('intval', $validated['assignee_ids'] ?? [])
            : $oldAssigneeIds;
        $newEpicIds = array_key_exists('epic_ids', $validated)
            ? array_map('intval', $validated['epic_ids'] ?? [])
            : $oldEpicIds;
        $newSprintIds = array_key_exists('sprint_ids', $validated)
            ? array_map('intval', $validated['sprint_ids'] ?? [])
            : $oldSprintIds;
        $newWatcherIds = array_key_exists('watcher_ids', $validated)
            ? array_map('intval', $validated['watcher_ids'] ?? [])
            : $oldWatcherIds;

        $task->refresh();

        $activity->updated($task, $request->user(), $before, $oldAssigneeIds, $newAssigneeIds, $oldEpicIds, $newEpicIds, $oldSprintIds, $newSprintIds, $oldWatcherIds, $newWatcherIds);

        if ($task->relationLoaded('watchers')) {
            $notifications->notifyWatchers($task, $request->user(), $task->watchers);
        }

        $fieldChanges = [];
        foreach (['title', 'description', 'priority_id', 'board_column_id', 'story_points', 'start_date', 'due_date'] as $field) {
            if (array_key_exists($field, $validated) && ($before[$field] ?? '') !== ($task->{$field} ?? '')) {
                $fieldChanges[$field] = $task->{$field};
            }
        }

        if ($fieldChanges !== []) {
            TaskFieldUpdated::dispatch($project->id, $task->id, $fieldChanges);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Task updated.']);

        return back();
    }

    public function destroy(Workspace $workspace, Project $project, Task $task, TaskActivityService $activity): RedirectResponse
    {
        Gate::authorize('delete', $task);

        $activity->deleted($task, request()->user());

        $task->delete();

        Inertia::flash('toast', ['type' => 'info', 'message' => 'Task deleted.']);

        return back();
    }

    public function moveColumn(MoveTaskColumnRequest $request, Workspace $workspace, Project $project, Task $task, TaskActivityService $activity): RedirectResponse
    {
        $validated = $request->validated();
        $fromColumn = $task->boardColumn;
        $targetColumn = BoardColumn::findOrFail($validated['board_column_id']);
        $position = (int) $validated['position'];

        $oldColumnId = $task->board_column_id;
        $isSameColumn = $oldColumnId === $targetColumn->id;

        if (! $isSameColumn && $targetColumn->wip_limit !== null) {
            $currentCount = $targetColumn->tasks()->where('id', '!=', $task->id)->count();
            if ($currentCount >= $targetColumn->wip_limit) {
                Inertia::flash('toast', [
                    'type' => 'warning',
                    'message' => "WIP limit reached for \"{$targetColumn->name}\" ({$currentCount}/{$targetColumn->wip_limit}).",
                ]);

                return back(303);
            }
        }

        DB::transaction(function () use ($task, $targetColumn, $position, $oldColumnId) {
            $task->update([
                'board_column_id' => $targetColumn->id,
                'status' => $targetColumn->status_key,
                'position' => $position,
            ]);

            // Rebalance target column — shift existing tasks to make room
            $targetTasks = Task::where('board_column_id', $targetColumn->id)
                ->where('id', '!=', $task->id)
                ->orderBy('position')
                ->orderBy('id')
                ->get();

            foreach ($targetTasks as $index => $t) {
                $t->updateQuietly(['position' => $index >= $position ? $index + 1 : $index]);
            }

            // Rebalance source column (if different) — close the gap
            if ($oldColumnId && $oldColumnId !== $targetColumn->id) {
                $sourceTasks = Task::where('board_column_id', $oldColumnId)
                    ->orderBy('position')
                    ->orderBy('id')
                    ->get();

                foreach ($sourceTasks as $index => $t) {
                    $t->updateQuietly(['position' => $index]);
                }
            }
        });

        $task->refresh();
        $activity->moved($task, $request->user(), $fromColumn, $targetColumn);

        broadcast(new TaskMoved(
            task: $task,
            fromColumnId: $oldColumnId,
            toColumnId: $targetColumn->id,
            position: $task->position,
            status: $targetColumn->status_key,
            projectId: $project->id,
        ))->toOthers();

        return back(303);
    }
}
