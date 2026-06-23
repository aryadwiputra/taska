<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCommentRequest;
use App\Http\Requests\UpdateCommentRequest;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use App\Models\Workspace;
use App\Services\MentionNotificationService;
use App\Services\MentionParser;
use App\Services\RealtimeGatewayService;
use App\Services\TaskActivityService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class TaskCommentController extends Controller
{
    public function store(StoreCommentRequest $request, Workspace $workspace, Project $project, Task $task, TaskActivityService $activity, MentionParser $mentionParser, MentionNotificationService $mentionNotifications): RedirectResponse
    {
        $validated = $request->validated();

        $comment = $task->comments()->create([
            'user_id' => $request->user()->id,
            'body' => $validated['body'],
            'parent_id' => $validated['parent_id'] ?? null,
        ]);

        $this->processMentions($comment, $task, $project, $request->user(), $mentionParser, $mentionNotifications);

        $activity->commented($task, $request->user(), $comment);

        app(RealtimeGatewayService::class)->broadcast("project.{$project->id}", 'comment.created', ['task_id' => $task->id, 'commentId' => $comment->id, 'body' => $comment->body]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Comment added.']);

        return back();
    }

    public function update(UpdateCommentRequest $request, Workspace $workspace, Project $project, Task $task, TaskComment $comment, MentionParser $mentionParser, MentionNotificationService $mentionNotifications): RedirectResponse
    {
        abort_unless((int) $comment->task_id === (int) $task->id, 404);

        $oldBody = $comment->body;

        $comment->update([
            'body' => $request->validated('body'),
            'edited_at' => now(),
        ]);

        if ($oldBody !== $comment->body) {
            $this->processMentions($comment, $task, $project, $request->user(), $mentionParser, $mentionNotifications);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Comment updated.']);

        return back();
    }

    private function processMentions(TaskComment $comment, Task $task, Project $project, User $commenter, MentionParser $mentionParser, MentionNotificationService $mentionNotifications): void
    {
        $result = $mentionParser->parse($comment->body, $project);
        $newUserIds = $result['mentioned_users']->pluck('id')->all();
        $mentionedTexts = $result['mentioned_texts'];
        $oldUserIds = $comment->mentions()->pluck('user_id')->all();

        $toRemove = array_diff($oldUserIds, $newUserIds);

        if ($toRemove !== []) {
            $comment->mentions()->whereIn('user_id', $toRemove)->delete();
        }

        $toAdd = array_diff($newUserIds, $oldUserIds);

        foreach ($toAdd as $index => $userId) {
            $originalIndex = array_search($userId, $newUserIds, true);
            $text = $originalIndex !== false && isset($mentionedTexts[$originalIndex]) ? $mentionedTexts[$originalIndex] : 'user';

            $comment->mentions()->create([
                'user_id' => $userId,
                'mentioned_text' => $text,
            ]);
        }

        if ($toAdd !== []) {
            $newUsers = User::whereKey($toAdd)->get();
            $mentionNotifications->notify($comment, $task, $commenter, $newUsers);

            $comment->mentions()->whereIn('user_id', $toAdd)->update(['notified_at' => now()]);
        }
    }

    public function destroy(Workspace $workspace, Project $project, Task $task, TaskComment $comment): RedirectResponse
    {
        abort_unless((int) $comment->task_id === (int) $task->id, 404);

        Gate::authorize('delete', $comment);

        $comment->delete();

        Inertia::flash('toast', ['type' => 'info', 'message' => 'Comment deleted.']);

        return back();
    }
}
