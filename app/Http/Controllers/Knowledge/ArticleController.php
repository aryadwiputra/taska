<?php

namespace App\Http\Controllers\Knowledge;

use App\Http\Controllers\Controller;
use App\Models\Knowledge\Article;
use App\Models\Knowledge\Category;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ArticleController extends Controller
{
    public function index(Request $request, Workspace $workspace): JsonResponse
    {
        $query = Article::where('workspace_id', $workspace->id)
            ->with('author:id,name,avatar')
            ->with('category:id,name,slug,color');

        if ($request->filled('category')) {
            $category = Category::where('workspace_id', $workspace->id)
                ->where('slug', $request->category)
                ->first();

            if ($category) {
                $query->where('category_id', $category->id);
            }
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        } else {
            $query->where('status', 'published');
        }

        if ($request->filled('author')) {
            $query->where('author_id', $request->author);
        }

        if ($request->filled('from_date')) {
            $query->where('published_at', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->where('published_at', '<=', $request->to_date);
        }

        $articles = $query->orderByDesc('published_at')->paginate(20);

        return response()->json($articles);
    }

    public function search(Request $request, Workspace $workspace): JsonResponse
    {
        $query = Article::where('workspace_id', $workspace->id)
            ->where('status', 'published')
            ->with('author:id,name,avatar')
            ->with('category:id,name,slug,color');

        if ($request->filled('q')) {
            $search = $request->q;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category')) {
            $category = Category::where('workspace_id', $workspace->id)
                ->where('slug', $request->category)
                ->first();

            if ($category) {
                $query->where('category_id', $category->id);
            }
        }

        if ($request->filled('author')) {
            $query->where('author_id', $request->author);
        }

        if ($request->filled('from_date')) {
            $query->where('published_at', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->where('published_at', '<=', $request->to_date);
        }

        $articles = $query->orderByDesc('published_at')->paginate(20);

        return response()->json($articles);
    }

    public function show(Workspace $workspace, Article $article): JsonResponse
    {
        if ($article->workspace_id !== $workspace->id) {
            abort(404);
        }

        $article->load('author:id,name,avatar');
        $article->load('category:id,name,slug,color');

        $article->incrementViews();

        return response()->json([
            'article' => [
                'id' => $article->id,
                'title' => $article->title,
                'slug' => $article->slug,
                'content' => $article->content,
                'views' => $article->views,
                'status' => $article->status,
                'published_at' => $article->published_at?->toIso8601String(),
                'author' => $article->author ? [
                    'id' => $article->author->id,
                    'name' => $article->author->name,
                    'avatar' => $article->author->avatar,
                ] : null,
                'category' => $article->category ? [
                    'id' => $article->category->id,
                    'name' => $article->category->name,
                    'slug' => $article->category->slug,
                    'color' => $article->category->color,
                ] : null,
                'attachments' => $article->attachments->map(fn ($a) => [
                    'id' => $a->id,
                    'file_name' => $a->file_name,
                    'mime_type' => $a->mime_type,
                    'file_size' => $a->file_size,
                    'file_size_formatted' => $a->formatted_size,
                    'url' => $a->url,
                    'is_previewable' => $a->isPreviewable(),
                ]),
                'created_at' => $article->created_at->toIso8601String(),
                'updated_at' => $article->updated_at->toIso8601String(),
            ],
        ]);
    }

    public function store(Request $request, Workspace $workspace): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'category_id' => ['nullable', 'integer', 'exists:knowledge_categories,id'],
            'status' => ['nullable', 'in:draft,published'],
        ]);

        $slug = Str::slug($validated['title']);
        $count = Article::where('workspace_id', $workspace->id)
            ->where('slug', 'like', $slug.'%')
            ->count();

        if ($count > 0) {
            $slug = $slug.'-'.($count + 1);
        }

        $article = Article::create([
            'workspace_id' => $workspace->id,
            'author_id' => $request->user()->id,
            'title' => $validated['title'],
            'slug' => $slug,
            'content' => $validated['content'] ?? null,
            'category_id' => $validated['category_id'] ?? null,
            'status' => $validated['status'] ?? 'draft',
            'published_at' => ($validated['status'] ?? 'draft') === 'published' ? now() : null,
        ]);

        $article->load('author:id,name,avatar');
        $article->load('category:id,name,slug,color');

        return response()->json([
            'article' => [
                'id' => $article->id,
                'title' => $article->title,
                'slug' => $article->slug,
                'status' => $article->status,
            ],
        ], 201);
    }

    public function update(Request $request, Workspace $workspace, Article $article): JsonResponse
    {
        if ($article->workspace_id !== $workspace->id) {
            abort(404);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'category_id' => ['nullable', 'integer', 'exists:knowledge_categories,id'],
            'status' => ['nullable', 'in:draft,published'],
        ]);

        if (isset($validated['title']) && $validated['title'] !== $article->title) {
            $slug = Str::slug($validated['title']);
            $count = Article::where('workspace_id', $workspace->id)
                ->where('slug', 'like', $slug.'%')
                ->where('id', '!=', $article->id)
                ->count();

            if ($count > 0) {
                $slug = $slug.'-'.($count + 1);
            }

            $validated['slug'] = $slug;
        }

        $article->update($validated);

        $article->load('author:id,name,avatar');
        $article->load('category:id,name,slug,color');

        return response()->json([
            'article' => [
                'id' => $article->id,
                'title' => $article->title,
                'slug' => $article->slug,
                'status' => $article->status,
            ],
        ]);
    }

    public function destroy(Workspace $workspace, Article $article): JsonResponse
    {
        if ($article->workspace_id !== $workspace->id) {
            abort(404);
        }

        $article->delete();

        return response()->json([
            'message' => 'Article deleted successfully.',
        ]);
    }
}
