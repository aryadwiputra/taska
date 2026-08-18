<?php

namespace App\Http\Controllers\Knowledge;

use App\Http\Controllers\Controller;
use App\Models\Knowledge\Category;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(Workspace $workspace): JsonResponse
    {
        $categories = Category::where('workspace_id', $workspace->id)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(function (Category $category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'description' => $category->description,
                    'icon' => $category->icon,
                    'color' => $category->color,
                    'articles_count' => $category->articles()->where('status', 'published')->count(),
                ];
            });

        return response()->json([
            'categories' => $categories,
        ]);
    }

    public function store(Request $request, Workspace $workspace): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:20'],
        ]);

        $slug = Str::slug($validated['name']);
        $count = Category::where('workspace_id', $workspace->id)
            ->where('slug', 'like', $slug . '%')
            ->count();

        if ($count > 0) {
            $slug = $slug . '-' . ($count + 1);
        }

        $category = Category::create([
            'workspace_id' => $workspace->id,
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'icon' => $validated['icon'] ?? null,
            'color' => $validated['color'] ?? '#6366F1',
            'sort_order' => Category::where('workspace_id', $workspace->id)->max('sort_order') + 1,
        ]);

        return response()->json([
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'description' => $category->description,
                'icon' => $category->icon,
                'color' => $category->color,
                'articles_count' => 0,
            ],
        ], 201);
    }

    public function update(Request $request, Workspace $workspace, Category $category): JsonResponse
    {
        if ($category->workspace_id !== $workspace->id) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:20'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $category->update($validated);

        return response()->json([
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'description' => $category->description,
                'icon' => $category->icon,
                'color' => $category->color,
                'articles_count' => $category->articles()->where('status', 'published')->count(),
            ],
        ]);
    }

    public function destroy(Workspace $workspace, Category $category): JsonResponse
    {
        if ($category->workspace_id !== $workspace->id) {
            abort(404);
        }

        $category->delete();

        return response()->json([
            'message' => 'Category deleted successfully.',
        ]);
    }
}
