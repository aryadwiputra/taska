<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDocAttachmentRequest;
use App\Models\Doc;
use App\Models\DocAttachment;
use App\Models\Project;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class DocAttachmentController extends Controller
{
    public function index(Workspace $workspace, Project $project, Doc $doc): JsonResponse
    {
        Gate::authorize('view', $project);

        $attachments = $doc->attachments()
            ->with('uploader:id,name,avatar')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (DocAttachment $attachment) => $this->formatAttachment($attachment));

        return response()->json([
            'attachments' => $attachments,
        ]);
    }

    public function store(StoreDocAttachmentRequest $request, Workspace $workspace, Project $project, Doc $doc): JsonResponse
    {
        Gate::authorize('view', $project);

        $file = $request->file('file');
        $disk = config('filesystems.default', 'public');

        $path = $file->store(
            "workspaces/{$workspace->id}/projects/{$project->id}/docs/{$doc->id}",
            $disk,
        );

        $attachment = $doc->attachments()->create([
            'uploaded_by' => $request->user()->id,
            'disk' => $disk,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize() ?: 0,
        ]);

        $attachment->load('uploader:id,name,avatar');

        return response()->json([
            'attachment' => $this->formatAttachment($attachment),
        ], 201);
    }

    public function destroy(Request $request, Workspace $workspace, Project $project, Doc $doc, DocAttachment $attachment): JsonResponse
    {
        Gate::authorize('view', $project);
        Gate::authorize('delete', $attachment);

        if ($attachment->doc_id !== $doc->id) {
            abort(404);
        }

        $attachment->delete();

        return response()->json([
            'message' => 'Attachment deleted successfully.',
        ]);
    }

    public function download(Request $request, Workspace $workspace, Project $project, Doc $doc, DocAttachment $attachment)
    {
        Gate::authorize('view', $project);

        if ($attachment->doc_id !== $doc->id) {
            abort(404);
        }

        if (!Storage::disk($attachment->disk)->exists($attachment->file_path)) {
            abort(404);
        }

        $mimeType = $attachment->mime_type ?? 'application/octet-stream';
        $filename = $attachment->file_name;

        $path = Storage::disk($attachment->disk)->path($attachment->file_path);

        return response()->download($path, null, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    public function preview(Request $request, Workspace $workspace, Project $project, Doc $doc, DocAttachment $attachment)
    {
        Gate::authorize('view', $project);

        if ($attachment->doc_id !== $doc->id) {
            abort(404);
        }

        if (!Storage::disk($attachment->disk)->exists($attachment->file_path)) {
            abort(404);
        }

        $mimeType = $attachment->mime_type ?? 'application/octet-stream';

        return Storage::disk($attachment->disk)->response(
            $attachment->file_path,
            $attachment->file_name,
            [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'inline; filename="'.$attachment->file_name.'"',
            ],
        );
    }

    protected function formatAttachment(DocAttachment $attachment): array
    {
        return [
            'id' => $attachment->id,
            'file_name' => $attachment->file_name,
            'mime_type' => $attachment->mime_type,
            'file_size' => $attachment->file_size,
            'file_size_formatted' => $attachment->formatted_size,
            'is_image' => $attachment->isImage(),
            'is_pdf' => $attachment->isPdf(),
            'is_previewable' => $attachment->isPreviewable(),
            'url' => $attachment->url,
            'preview_url' => $attachment->preview_url,
            'download_url' => $attachment->url,
            'uploaded_by' => $attachment->uploader ? [
                'id' => $attachment->uploader->id,
                'name' => $attachment->uploader->name,
                'avatar' => $attachment->uploader->avatar,
            ] : null,
            'created_at' => $attachment->created_at->toIso8601String(),
        ];
    }
}
