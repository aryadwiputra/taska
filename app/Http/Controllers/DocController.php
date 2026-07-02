<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDocRequest;
use App\Models\Doc;
use App\Models\DocVersion;
use App\Models\Project;
use App\Models\Workspace;
use App\Support\DocTreeBuilder;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DocController extends Controller
{
    public function index(Workspace $workspace, Project $project): Response
    {
        Gate::authorize('view', $project);

        $tree = DocTreeBuilder::buildTree(
            $project->docs()->with('author:id,name,avatar')->ordered()->get()
        );

        return Inertia::render('projects/docs/index', [
            'workspace' => ['id' => $workspace->id, 'name' => $workspace->name, 'slug' => $workspace->slug],
            'project' => ['id' => $project->id, 'name' => $project->name, 'key' => $project->key, 'slug' => $project->slug],
            'docsTree' => $tree,
        ]);
    }

    public function show(Workspace $workspace, Project $project, Doc $doc): Response
    {
        Gate::authorize('view', $doc);

        $doc->load(['author:id,name,avatar', 'children' => fn ($q) => $q->ordered()->with('author:id,name,avatar')]);

        $breadcrumbs = $this->buildBreadcrumbs($doc);

        $docArray = $doc->toArray();
        $docArray['children'] = $doc->children->map(fn ($child) => [
            'id' => $child->id,
            'title' => $child->title,
            'slug' => $child->slug,
            'author' => $child->relationLoaded('author') && $child->author ? [
                'id' => $child->author->id,
                'name' => $child->author->name,
                'avatar' => $child->author->avatar,
            ] : null,
        ])->toArray();

        return Inertia::render('projects/docs/show', [
            'workspace' => ['id' => $workspace->id, 'name' => $workspace->name, 'slug' => $workspace->slug],
            'project' => ['id' => $project->id, 'name' => $project->name, 'key' => $project->key, 'slug' => $project->slug],
            'doc' => $docArray + ['breadcrumbs' => $breadcrumbs, 'versions_count' => $doc->versions()->count()],
        ]);
    }

    public function store(StoreDocRequest $request, Workspace $workspace, Project $project): RedirectResponse
    {
        $validated = $request->validated();

        $doc = $project->docs()->create([
            'parent_id' => $validated['parent_id'] ?? null,
            'created_by' => $request->user()->id,
            'title' => $validated['title'],
            'slug' => $validated['slug'] ?? Str::slug($validated['title']),
            'content' => $validated['content'] ?? '',
            'sort_order' => $project->docs()->max('sort_order') + 1,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Doc created.']);

        return to_route('projects.docs.show', [$workspace, $project, $doc]);
    }

    public function update(StoreDocRequest $request, Workspace $workspace, Project $project, Doc $doc): RedirectResponse
    {
        Gate::authorize('update', $doc);

        $doc->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Doc updated.']);

        return back(303);
    }

    public function destroy(Workspace $workspace, Project $project, Doc $doc): RedirectResponse
    {
        Gate::authorize('delete', $doc);

        $doc->delete();

        Inertia::flash('toast', ['type' => 'info', 'message' => 'Doc deleted.']);

        return to_route('projects.docs.index', [$workspace, $project]);
    }

    public function search(Request $request, Workspace $workspace, Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        $q = $request->query('q', '');

        $results = $project->docs()
            ->where(function ($query) use ($q) {
                $query->where('title', 'like', "%{$q}%")
                    ->orWhere('content', 'like', "%{$q}%");
            })
            ->ordered()
            ->get(['id', 'title', 'slug', 'parent_id', 'updated_at']);

        return response()->json($results);
    }

    public function reorder(Request $request, Workspace $workspace, Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        $orders = $request->validate([
            'orders' => ['required', 'array'],
            'orders.*.id' => ['required', 'integer', 'exists:docs,id'],
            'orders.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        foreach ($orders['orders'] as $order) {
            Doc::where('id', $order['id'])->update(['sort_order' => $order['sort_order']]);
        }

        return response()->json(['message' => 'Reordered.']);
    }

    public function pdf(Workspace $workspace, Project $project, Doc $doc): \Illuminate\Http\Response
    {
        Gate::authorize('view', $doc);

        $html = view('docs.pdf', [
            'title' => $doc->title,
            'content' => $doc->content,
            'project' => $project->name,
            'updated_at' => $doc->updated_at->format('Y-m-d'),
        ])->render();

        $pdf = Pdf::loadHTML($html);

        return $pdf->download(Str::slug($doc->title).'.pdf');
    }

    public function versions(Workspace $workspace, Project $project, Doc $doc): JsonResponse
    {
        Gate::authorize('view', $doc);

        $versions = $doc->versions()->with('editor:id,name,avatar')->latest()->get();

        return response()->json($versions);
    }

    public function restoreVersion(Request $request, Workspace $workspace, Project $project, Doc $doc, DocVersion $version): RedirectResponse
    {
        Gate::authorize('update', $doc);

        $doc->update([
            'title' => $version->title,
            'content' => $version->content,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Version restored.']);

        return back(303);
    }

    private function buildBreadcrumbs(Doc $doc): array
    {
        $crumbs = [];
        $current = $doc;

        while ($current->parent) {
            $current->load('parent');
            $crumbs[] = ['title' => $current->parent->title, 'slug' => $current->parent->slug];
            $current = $current->parent;
        }

        return array_reverse($crumbs);
    }
}
