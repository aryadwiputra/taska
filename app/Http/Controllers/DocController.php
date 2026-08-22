<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDocRequest;
use App\Http\Requests\UpdateDocRequest;
use App\Models\Doc;
use App\Models\DocVersion;
use App\Models\Project;
use App\Models\Task;
use App\Models\Workspace;
use App\Support\DocTreeBuilder;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

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

        $tree = DocTreeBuilder::buildTree(
            $project->docs()->with('author:id,name,avatar')->ordered()->get()
        );

        return Inertia::render('projects/docs/show', [
            'workspace' => ['id' => $workspace->id, 'name' => $workspace->name, 'slug' => $workspace->slug],
            'project' => ['id' => $project->id, 'name' => $project->name, 'key' => $project->key, 'slug' => $project->slug],
            'doc' => $docArray + ['breadcrumbs' => $breadcrumbs, 'versions_count' => $doc->versions()->count()],
            'docsTree' => $tree,
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
            'visibility' => $validated['visibility'] ?? 'project',
            'sort_order' => $project->docs()->max('sort_order') + 1,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Doc created.']);

        return to_route('projects.docs.show', [$workspace, $project, $doc]);
    }

    public function update(UpdateDocRequest $request, Workspace $workspace, Project $project, Doc $doc): RedirectResponse
    {
        Gate::authorize('update', $doc);

        $doc->update($request->safe()->only(['title', 'parent_id', 'slug', 'content', 'visibility']));

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

    public function seedTemplates(Request $request, Workspace $workspace, Project $project): RedirectResponse
    {
        Gate::authorize('update', $project);

        if ($project->docs()->exists()) {
            return back()->with('error', 'Project already has docs.');
        }

        $user = $request->user();
        $templates = [
            ['title' => 'Meeting Notes', 'slug' => 'meeting-notes', 'content' => '<h1>Meeting Notes</h1><p><em>Use this template to document meeting outcomes and action items.</em></p><h2>Meeting Details</h2><ul><li><strong>Date:</strong> </li><li><strong>Attendees:</strong> </li><li><strong>Facilitator:</strong> </li></ul><h2>Agenda</h2><ol><li>Item 1</li><li>Item 2</li></ol><h2>Discussion Notes</h2><p>Record key points here.</p><h2>Decisions Made</h2><ul><li>Decision 1</li></ul><h2>Action Items</h2><ul><li>[Owner] — [Action] — Due: [Date]</li></ul>', 'sort_order' => 1],
            ['title' => 'Technical Specification', 'slug' => 'technical-specification', 'content' => '<h1>Technical Specification</h1><p><em>Document technical design and implementation details.</em></p><h2>Overview</h2><p>Brief description of the feature or system.</p><h2>Goals</h2><ul><li>Goal 1</li><li>Goal 2</li></ul><h2>Background</h2><p>Why is this needed?</p><h2>Detailed Design</h2><h3>Architecture</h3><p>System architecture description.</p><h3>Data Model</h3><p>Database schema changes.</p><h2>Alternatives Considered</h2><p>Other approaches evaluated.</p><h2>Risks</h2><ul><li>[Risk] — [Mitigation]</li></ul>', 'sort_order' => 2],
            ['title' => 'Standard Operating Procedure', 'slug' => 'standard-operating-procedure', 'content' => '<h1>Standard Operating Procedure</h1><p><em>Document a repeatable process for your team.</em></p><h2>Purpose</h2><p>Why does this SOP exist?</p><h2>Scope</h2><p>Who does this apply to?</p><h2>Prerequisites</h2><ul><li>Requirement 1</li></ul><h2>Procedure</h2><ol><li><strong>Step 1:</strong> Description</li><li><strong>Step 2:</strong> Description</li></ol><h2>Troubleshooting</h2><ul><li>[Problem] — [Solution]</li></ul>', 'sort_order' => 3],
        ];

        foreach ($templates as $i => $t) {
            $project->docs()->create([
                'created_by' => $user?->id,
                'title' => $t['title'],
                'slug' => $t['slug'],
                'content' => $t['content'],
                'sort_order' => $t['sort_order'],
                'visibility' => 'project',
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Templates created.']);

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
            'orders.*.id' => ['required', 'integer', Rule::exists('docs', 'id')->where('project_id', $project->id)],
            'orders.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        foreach ($orders['orders'] as $order) {
            Doc::where('id', $order['id'])->update(['sort_order' => $order['sort_order']]);
        }

        return response()->json(['message' => 'Reordered.']);
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

    public function pdf(Workspace $workspace, Project $project, Doc $doc): SymfonyResponse
    {
        Gate::authorize('view', $doc);

        $doc->load(['author:id,name']);

        $pdf = Pdf::loadView('docs.pdf', [
            'doc' => $doc,
            'project' => $project,
        ]);

        $filename = Str::slug($doc->title).'-'.$doc->id.'.pdf';

        return $pdf->download($filename);
    }

    public function embed(Request $request, Workspace $workspace): JsonResponse
    {
        $q = $request->query('q', '');

        if (! str_contains($q, '-')) {
            return response()->json(['found' => false]);
        }

        [$code, $taskNumber] = explode('-', $q, 2);

        $task = Task::query()
            ->whereHas('project', fn ($p) => $p->where('workspace_id', $workspace->id))
            ->where('code', $code)
            ->where('task_number', $taskNumber)
            ->with('project:id,slug')
            ->first(['id', 'code', 'task_number', 'title', 'project_id']);

        if (! $task) {
            return response()->json(['found' => false]);
        }

        $projectSlug = $task->project->slug;

        return response()->json([
            'found' => true,
            'task_id' => $task->id,
            'task_code' => $task->code.'-'.$task->task_number,
            'task_title' => $task->title,
            'url' => "/workspaces/{$workspace->slug}/projects/{$projectSlug}/tasks/{$task->id}",
        ]);
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
