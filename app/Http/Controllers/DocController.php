<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDocRequest;
use App\Models\Doc;
use App\Models\Project;
use App\Models\Workspace;
use App\Support\DocTreeBuilder;
use Illuminate\Http\RedirectResponse;
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

        return Inertia::render('projects/docs/show', [
            'workspace' => ['id' => $workspace->id, 'name' => $workspace->name, 'slug' => $workspace->slug],
            'project' => ['id' => $project->id, 'name' => $project->name, 'key' => $project->key, 'slug' => $project->slug],
            'doc' => $doc->toArray() + ['breadcrumbs' => $breadcrumbs],
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
