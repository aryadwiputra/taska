<?php

namespace App\Http\Controllers\Knowledge;

use App\Http\Controllers\Controller;
use App\Models\Knowledge\Article;
use App\Models\Knowledge\Category;
use App\Models\Workspace;
use Illuminate\Support\Facades\Gate;

class KnowledgePageController extends Controller
{
    public function index(Workspace $workspace)
    {
        Gate::authorize('view', $workspace);

        $categories = Category::where('workspace_id', $workspace->id)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Category $cat) => [
                'id' => $cat->id,
                'name' => $cat->name,
                'slug' => $cat->slug,
                'description' => $cat->description,
                'icon' => $cat->icon,
                'color' => $cat->color,
                'articles_count' => $cat->articles()->where('status', 'published')->count(),
            ]);

        $recentArticles = Article::where('workspace_id', $workspace->id)
            ->where('status', 'published')
            ->with('author:id,name,avatar')
            ->orderByDesc('published_at')
            ->limit(10)
            ->get()
            ->map(fn (Article $article) => [
                'id' => $article->id,
                'title' => $article->title,
                'slug' => $article->slug,
                'views' => $article->views,
                'status' => $article->status,
                'published_at' => $article->published_at?->toIso8601String(),
                'author' => $article->author ? [
                    'id' => $article->author->id,
                    'name' => $article->author->name,
                    'avatar' => $article->author->avatar,
                ] : null,
                'category' => null,
                'created_at' => $article->created_at->toIso8601String(),
            ]);

        return inertia('knowledge/index', [
            'categories' => $categories,
            'recentArticles' => $recentArticles,
        ]);
    }

    public function article(Workspace $workspace, Article $article)
    {
        Gate::authorize('view', $article);

        $article->load('author:id,name,avatar');
        $article->load('category:id,name,slug,color');
        $article->load('attachments');

        $article->incrementViews();

        $canEdit = Gate::allows('update', $article);

        return inertia('knowledge/articles/show', [
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
                    'is_image' => $a->isImage(),
                    'is_pdf' => $a->isPdf(),
                    'is_previewable' => $a->isPreviewable(),
                    'url' => $a->url,
                ]),
                'created_at' => $article->created_at->toIso8601String(),
                'updated_at' => $article->updated_at->toIso8601String(),
            ],
            'canEdit' => $canEdit,
        ]);
    }
}
