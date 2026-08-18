<?php

namespace App\Http\Controllers\Knowledge;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreArticleAttachmentRequest;
use App\Models\Knowledge\Article;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ArticleAttachmentController extends Controller
{
    public function index(Workspace $workspace, Article $article): JsonResponse
    {
        if ($article->workspace_id !== $workspace->id) {
            abort(404);
        }

        $attachments = $article->attachments()
            ->with('uploader:id,name,avatar')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'file_name' => $a->file_name,
                'mime_type' => $a->mime_type,
                'file_size' => $a->file_size,
                'file_size_formatted' => $a->formatted_size,
                'is_image' => $a->isImage(),
                'is_pdf' => $a->isPdf(),
                'is_previewable' => $a->isPreviewable(),
                'url' => $a->url,
                'uploaded_by' => $a->uploader ? [
                    'id' => $a->uploader->id,
                    'name' => $a->uploader->name,
                    'avatar' => $a->uploader->avatar,
                ] : null,
                'created_at' => $a->created_at->toIso8601String(),
            ]);

        return response()->json([
            'attachments' => $attachments,
        ]);
    }

    public function store(StoreArticleAttachmentRequest $request, Workspace $workspace, Article $article): JsonResponse
    {
        if ($article->workspace_id !== $workspace->id) {
            abort(404);
        }

        $file = $request->file('file');
        $disk = config('filesystems.default', 'public');

        $path = $file->store(
            "workspaces/{$workspace->id}/knowledge/articles/{$article->id}",
            $disk,
        );

        $attachment = $article->attachments()->create([
            'uploaded_by' => $request->user()->id,
            'disk' => $disk,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize() ?: 0,
        ]);

        $attachment->load('uploader:id,name,avatar');

        return response()->json([
            'attachment' => [
                'id' => $attachment->id,
                'file_name' => $attachment->file_name,
                'mime_type' => $attachment->mime_type,
                'file_size' => $attachment->file_size,
                'file_size_formatted' => $attachment->formatted_size,
                'is_image' => $attachment->isImage(),
                'is_pdf' => $attachment->isPdf(),
                'is_previewable' => $attachment->isPreviewable(),
                'url' => $attachment->url,
                'uploaded_by' => $attachment->uploader ? [
                    'id' => $attachment->uploader->id,
                    'name' => $attachment->uploader->name,
                    'avatar' => $attachment->uploader->avatar,
                ] : null,
                'created_at' => $attachment->created_at->toIso8601String(),
            ],
        ], 201);
    }

    public function destroy(Request $request, Workspace $workspace, Article $article, $attachmentId): JsonResponse
    {
        if ($article->workspace_id !== $workspace->id) {
            abort(404);
        }

        $attachment = $article->attachments()->findOrFail($attachmentId);
        $attachment->delete();

        return response()->json([
            'message' => 'Attachment deleted successfully.',
        ]);
    }

    public function download(Request $request, Workspace $workspace, Article $article, $attachmentId)
    {
        if ($article->workspace_id !== $workspace->id) {
            abort(404);
        }

        $attachment = $article->attachments()->findOrFail($attachmentId);

        if (! Storage::disk($attachment->disk)->exists($attachment->file_path)) {
            abort(404);
        }

        $mimeType = $attachment->mime_type ?? 'application/octet-stream';
        $filename = $attachment->file_name;
        $path = Storage::disk($attachment->disk)->path($attachment->file_path);

        return response()->download($path, $filename, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }
}
