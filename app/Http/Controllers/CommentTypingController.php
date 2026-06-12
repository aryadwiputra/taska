<?php

namespace App\Http\Controllers;

use App\Events\CommentTyping;
use App\Models\Project;
use App\Models\Task;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CommentTypingController extends Controller
{
    public function ping(Request $request, Workspace $workspace, Project $project, Task $task): JsonResponse
    {
        Gate::authorize('view', $project);

        CommentTyping::dispatch(
            $project->id,
            $task->id,
            $request->user()->id,
            $request->user()->name,
        );

        return response()->json(['ok' => true]);
    }
}
