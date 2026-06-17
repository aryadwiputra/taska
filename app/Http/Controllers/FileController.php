<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\TaskAttachment;
use App\Models\Workspace;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class FileController extends Controller
{
    public function index(Workspace $workspace, Project $project): Response
    {
        Gate::authorize('view', $project);

        $attachments = TaskAttachment::query()
            ->with(['task:id,project_id,code,title', 'uploader:id,name,avatar'])
            ->whereHas('task', fn ($query) => $query->where('project_id', $project->id))
            ->latest()
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

        return Inertia::render('projects/files/index', [
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
            'attachments' => $attachments,
        ]);
    }
}
