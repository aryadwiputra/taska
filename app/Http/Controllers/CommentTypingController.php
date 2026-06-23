<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use App\Models\Workspace;
use App\Services\RealtimeGatewayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CommentTypingController extends Controller
{
    public function ping(Request $request, Workspace $workspace, Project $project, Task $task): JsonResponse
    {
        Gate::authorize('view', $project);

        app(RealtimeGatewayService::class)->broadcast("project.{$project->id}", 'comment.typing', ['task_id' => $task->id, 'user_id' => $request->user()->id, 'user_name' => $request->user()->name]);

        return response()->json(['ok' => true]);
    }
}
