<?php

namespace App\Http\Controllers;

use App\Http\Requests\MoveTaskColumnRequest;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Models\BoardColumn;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskActivity;
use App\Models\TaskApproval;
use App\Models\Workspace;
use App\Services\AutomationEngine;
use App\Services\NotificationService;
use App\Services\RealtimeGatewayService;
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
            'children:id,parent_id,code,title,completed_at,priority_id',
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
                'github_branch' => $task->github_branch,
            ],
            'comments' => $comments,
            'attachments' => $attachments,
            'activities' => $activities,
            'has_github_integration' => $project->integration()->where('provider', 'github')->exists(),
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

        app(RealtimeGatewayService::class)->broadcast("project.{$project->id}", 'task.created', [
            'task' => $this->formatTaskForRealtime($task->load(['assignees:id,name,avatar', 'priority', 'taskType', 'epics', 'sprints', 'boardColumn'])),
            'column_id' => $task->board_column_id,
        ]);

        app(AutomationEngine::class)->handleTaskEvent($task->refresh(), 'task.created');

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
        foreach (['title', 'description', 'priority_id', 'board_column_id', 'story_points', 'start_date', 'due_date', 'task_type_id', 'parent_id'] as $field) {
            if (array_key_exists($field, $validated) && ($before[$field] ?? '') !== ($task->{$field} ?? '')) {
                $fieldChanges[$field] = $task->{$field};
            }
        }

        if ($fieldChanges !== []) {
            $changes = [];

            foreach ($fieldChanges as $field => $value) {
                switch ($field) {
                    case 'priority_id':
                        $changes['priority'] = $task->priority ? [
                            'id' => $task->priority->id,
                            'name' => $task->priority->name,
                            'key' => $task->priority->key,
                            'color' => $task->priority->color,
                        ] : null;
                        break;
                    case 'board_column_id':
                        $changes['board_column'] = $task->boardColumn ? [
                            'id' => $task->boardColumn->id,
                            'name' => $task->boardColumn->name,
                            'status_key' => $task->boardColumn->status_key,
                            'color' => $task->boardColumn->color,
                        ] : null;
                        break;
                    case 'task_type_id':
                        $changes['task_type'] = [
                            'id' => $task->taskType->id,
                            'name' => $task->taskType->name,
                            'key' => $task->taskType->key,
                            'color' => $task->taskType->color,
                        ];
                        break;
                    case 'parent_id':
                        $changes['parent'] = $task->parent ? [
                            'id' => $task->parent->id,
                            'code' => $task->parent->code,
                            'title' => $task->parent->title,
                        ] : null;
                        $changes['parent_id'] = $value;
                        break;
                    default:
                        $changes[$field] = $value;
                        break;
                }
            }

            if (array_key_exists('assignee_ids', $validated)) {
                $changes['assignees'] = $task->assignees->map(fn ($u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'avatar' => $u->avatar,
                ])->values()->all();
            }
            if (array_key_exists('label_ids', $validated)) {
                $changes['labels'] = $task->labels->map(fn ($l) => [
                    'id' => $l->id,
                    'name' => $l->name,
                    'slug' => $l->slug,
                    'color' => $l->color,
                ])->values()->all();
            }
            if (array_key_exists('epic_ids', $validated)) {
                $changes['epics'] = $task->epics->map(fn ($e) => [
                    'id' => $e->id,
                    'name' => $e->name,
                    'color' => $e->color,
                    'status' => $e->status,
                ])->values()->all();
            }
            if (array_key_exists('sprint_ids', $validated)) {
                $changes['sprints'] = $task->sprints->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'status' => $s->status,
                    'start_date' => $s->start_date,
                    'end_date' => $s->end_date,
                ])->values()->all();
            }
            if (array_key_exists('watcher_ids', $validated)) {
                $changes['watcher_count'] = $task->watchers()->count();
            }

            app(RealtimeGatewayService::class)->broadcast("project.{$project->id}", 'task.field.updated', [
                'taskId' => $task->id,
                'changes' => $changes,
            ]);
        }

        if (array_key_exists('board_column_id', $fieldChanges)) {
            $oldColumnId = (int) ($before['board_column_id'] ?? $task->board_column_id);
            $toColumn = BoardColumn::findOrFail($task->board_column_id);

            $maxPosition = (int) Task::where('board_column_id', $task->board_column_id)
                ->where('id', '!=', $task->id)
                ->max('position');

            $task->updateQuietly(['position' => $maxPosition + 1000]);
            $task->refresh();

            app(RealtimeGatewayService::class)->broadcast("project.{$project->id}", 'task.moved', [
                'taskId' => $task->id,
                'task' => $this->formatTaskForRealtime($task->load(['assignees:id,name,avatar', 'priority', 'taskType', 'epics', 'sprints', 'boardColumn'])),
                'fromColumnId' => $oldColumnId,
                'toColumnId' => $toColumn->id,
                'position' => $task->position,
                'status' => $toColumn->status_key,
            ]);
        }

        if (array_key_exists('assignee_ids', $validated)) {
            $addedAssignees = array_diff($newAssigneeIds, $oldAssigneeIds);

            if (! empty($addedAssignees)) {
                app(AutomationEngine::class)->handleTaskEvent($task, 'task.assignee_added', [
                    'assignee_ids' => $addedAssignees,
                ]);
            }
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Task updated.']);

        return back(303);
    }

    public function destroy(Workspace $workspace, Project $project, Task $task, TaskActivityService $activity): RedirectResponse
    {
        Gate::authorize('delete', $task);

        $activity->deleted($task, request()->user());

        app(RealtimeGatewayService::class)->broadcast("project.{$project->id}", 'task.deleted', [
            'projectId' => $project->id,
            'taskId' => $task->id,
        ]);

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

        // Check for approval flows on the target column
        if (! $isSameColumn) {
            $approvalFlow = $project->approvalFlows()
                ->where('column_id', $targetColumn->id)
                ->where('enabled', true)
                ->first();

            if ($approvalFlow) {
                // Check if task already has pending approval for this flow
                $existingApproval = $task->approvals()
                    ->where('approval_flow_id', $approvalFlow->id)
                    ->where('status', 'pending')
                    ->first();

                if (! $existingApproval) {
                    // Create approval requests
                    $approvers = $this->resolveApprovers($approvalFlow->required_approvers, $workspace);

                    foreach ($approvers as $approverId) {
                        TaskApproval::create([
                            'task_id' => $task->id,
                            'approval_flow_id' => $approvalFlow->id,
                            'approver_id' => $approverId,
                            'status' => 'pending',
                        ]);
                    }

                    Inertia::flash('toast', [
                        'type' => 'info',
                        'message' => "Approval required to move to \"{$targetColumn->name}\". Requests sent to approvers.",
                    ]);

                    return back(303);
                }

                // Check if enough approvals exist
                $approvedCount = $task->approvals()
                    ->where('approval_flow_id', $approvalFlow->id)
                    ->where('status', 'approved')
                    ->count();

                if ($approvedCount < $approvalFlow->min_approvals) {
                    Inertia::flash('toast', [
                        'type' => 'warning',
                        'message' => "Awaiting approval ({$approvedCount}/{$approvalFlow->min_approvals}).",
                    ]);

                    return back(303);
                }
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

        if (! $isSameColumn) {
            app(AutomationEngine::class)->handleTaskEvent($task, 'task.status_changed', [
                'from' => $fromColumn?->status_key,
                'to' => $targetColumn->status_key,
            ]);
        }

        app(RealtimeGatewayService::class)->broadcast("project.{$project->id}", 'task.moved', [
            'taskId' => $task->id,
            'task' => $this->formatTaskForRealtime($task->load(['assignees:id,name,avatar', 'priority', 'taskType', 'epics', 'sprints', 'boardColumn'])),
            'fromColumnId' => $oldColumnId,
            'toColumnId' => $targetColumn->id,
            'position' => $task->position,
            'status' => $targetColumn->status_key,
        ]);

        return back(303);
    }

    protected function resolveApprovers(array $requiredApprovers, Workspace $workspace): array
    {
        $approverIds = [];

        foreach ($requiredApprovers as $approver) {
            $type = $approver['type'] ?? '';
            $value = $approver['value'] ?? null;

            if ($type === 'user') {
                $approverIds[] = (int) str_replace('user:', '', $value);
            } elseif ($type === 'role') {
                $roleMembers = $workspace->members()
                    ->where('role', $value)
                    ->pluck('user_id')
                    ->all();
                $approverIds = array_merge($approverIds, $roleMembers);
            }
        }

        return array_unique($approverIds);
    }

    public function createBranch(Workspace $workspace, Project $project, Task $task): JsonResponse
    {
        Gate::authorize('update', $task);

        $integration = $project->integration()->where('provider', 'github')->first();

        if (! $integration) {
            return response()->json(['error' => 'GitHub integration not connected.'], 422);
        }

        try {
            $github = $integration->githubApi();
            $repo = $integration->metadata['repo'] ?? $project->metadata['github_repo'] ?? null;

            if (! $repo) {
                return response()->json(['error' => 'GitHub repository not configured.'], 422);
            }

            // Get default branch
            $repoResponse = $github->get("repos/{$repo}");
            $repoData = json_decode($repoResponse->getBody()->getContents(), true);
            $defaultBranch = $repoData['default_branch'] ?? 'main';

            // Create branch
            $branchName = $task->github_branch;

            // Get HEAD SHA of default branch
            $headRef = $github->get("repos/{$repo}/git/ref/heads/{$defaultBranch}");
            $headData = json_decode($headRef->getBody()->getContents(), true);
            $sha = $headData['object']['sha'];

            // Create new ref
            $github->post("repos/{$repo}/git/refs", [
                'json' => [
                    'ref' => "refs/heads/{$branchName}",
                    'sha' => $sha,
                ],
            ]);

            // Log activity
            TaskActivity::create([
                'task_id' => $task->id,
                'user_id' => request()->user()->id,
                'action' => 'github_branch_created',
                'field_name' => 'github',
                'new_value' => $branchName,
                'metadata' => ['repository' => $repo, 'branch' => $branchName],
            ]);

            return response()->json([
                'branch' => $branchName,
                'url' => "https://github.com/{$repo}/tree/{$branchName}",
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create branch: '.$e->getMessage()], 500);
        }
    }

    private function formatTaskForRealtime(Task $task): array
    {
        return [
            'id' => $task->id,
            'task_number' => $task->task_number,
            'code' => $task->code,
            'title' => $task->title,
            'status' => $task->status,
            'position' => $task->position,
            'due_date' => $task->due_date,
            'story_points' => $task->story_points,
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
            'assignees' => $task->assignees->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'avatar' => $u->avatar,
            ])->values()->all(),
            'epics' => $task->epics->map(fn ($e) => [
                'id' => $e->id,
                'name' => $e->name,
                'color' => $e->color,
                'status' => $e->status,
            ])->values()->all(),
            'sprints' => $task->sprints->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'status' => $s->status,
                'start_date' => $s->start_date,
                'end_date' => $s->end_date,
            ])->values()->all(),
        ];
    }
}
