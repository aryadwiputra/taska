# Implementation Plan — Project Docs Module

> Generated: July 1, 2026  
> Stack: PHP 8.3 / Laravel 13 / React 19 / Inertia v3 / Tailwind v4 / Pest 4 / Wayfinder / TipTap

---

## Table of Contents

- [Overview](#overview)
- [Todo List](#todo-list)
- [Phase 1 — Backend](#phase-1--backend)
- [Phase 2 — Frontend](#phase-2--frontend)
- [Phase 3 — Post-MVP](#phase-3--post-mvp)
- [File Manifest](#file-manifest)

---

## Overview

Fitur dokumentasi per-project — knowledge base internal untuk setiap project di Taska. Mirip Jira Docs / Confluence page.

**Fitur MVP:**
- CRUD docs per project
- Hierarki parent-child (nesting)
- Rich text editor (TipTap)
- Slug-based routing
- Sidebar tree navigasi
- Breadcrumbs (parent chain)
- Hanya anggota project yang bisa create/edit/delete

---

## Todo List

### Phase 1 — Backend

- [ ] P1.1: Migration `create_docs_table`
- [ ] P1.2: Model `Doc`
- [ ] P1.3: Policy `DocPolicy` + register di `AppServiceProvider`
- [ ] P1.4: Form Request `StoreDocRequest`
- [ ] P1.5: Controller `DocController` (index, show, store, update, destroy)
- [ ] P1.6: Routes di `web.php`
- [ ] P1.7: `DocTreeBuilder` service class
- [ ] P1.8: `php artisan wayfinder:generate`

### Phase 2 — Frontend

- [ ] P2.1: TypeScript types `docs.ts`
- [ ] P2.2: i18n keys EN/ID
- [ ] P2.3: `RichEditor` component (TipTap)
- [ ] P2.4: Page `projects/docs/index.tsx`
- [ ] P2.5: Page `projects/docs/show.tsx`
- [ ] P2.6: Tab trigger di `projects/show.tsx`
- [ ] P2.7: Install `@tiptap/react`

### Phase 3 — Post-MVP

- [ ] P3.1: Version history (`doc_versions` table + restore)
- [ ] P3.2: Full-text search
- [ ] P3.3: Task embed (`/task:DTKL-123`)
- [ ] P3.4: Templates (SOP, meeting notes, technical spec)
- [ ] P3.5: Drag-and-drop reorder sidebar
- [ ] P3.6: Export PDF
- [ ] P3.7: Per-doc permissions

---

## Phase 1 — Backend

### P1.1 Migration

```php
Schema::create('docs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
    $table->foreignId('parent_id')->nullable()->constrained('docs')->cascadeOnDelete();
    $table->foreignId('created_by')->constrained('users');
    $table->string('title');
    $table->string('slug', 200);
    $table->longText('content')->nullable();
    $table->unsignedInteger('sort_order')->default(0);
    $table->softDeletes();
    $table->timestamps();

    $table->unique(['project_id', 'slug']);
    $table->index(['project_id', 'sort_order']);
});
```

### P1.2 Model

```php
class Doc extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'project_id', 'parent_id', 'created_by',
        'title', 'slug', 'content', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Doc::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Doc::class, 'parent_id')->orderBy('sort_order');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeRoots(Builder $query): Builder
    {
        return $query->whereNull('parent_id');
    }
}
```

### P1.3 Policy

```php
class DocPolicy
{
    public function viewAny(User $user, Project $project): bool
    {
        return $user->can('view', $project);
    }

    public function view(User $user, Doc $doc): bool
    {
        return $user->can('view', $doc->project);
    }

    public function create(User $user, Project $project): bool
    {
        return Rbac::userCanInWorkspace($user, $project->workspace, 'project.create')
            && Rbac::projectRoleAllows($user, $project, ['lead', 'manager']);
    }

    public function update(User $user, Doc $doc): bool
    {
        return Rbac::userCanInWorkspace($user, $doc->project->workspace, 'project.create')
            && Rbac::projectRoleAllows($user, $doc->project, ['lead', 'manager']);
    }

    public function delete(User $user, Doc $doc): bool
    {
        return $this->update($user, $doc) || $doc->created_by === $user->id;
    }
}
```

Register di `AppServiceProvider::configureAuthorization()`:
```php
Gate::policy(Doc::class, DocPolicy::class);
```

### P1.4 Form Request

```php
class StoreDocRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', [Doc::class, $this->project]) ?? false;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'parent_id' => [
                'nullable', 'integer',
                Rule::exists('docs', 'id')->where('project_id', $this->project->id),
            ],
            'slug' => ['nullable', 'string', 'max:200', new AlphaDash],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->mergeIfMissing([
            'slug' => Str::slug($this->input('title')),
        ]);
    }
}
```

### P1.5 Controller

```php
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
```

### P1.6 Routes

Di dalam `Route::scopeBindings()` group di `routes/web.php` (setelah route project):

```php
Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/docs', [DocController::class, 'index'])->name('projects.docs.index');
Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/docs/{doc:slug}', [DocController::class, 'show'])->name('projects.docs.show');
Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/docs', [DocController::class, 'store'])->name('projects.docs.store');
Route::patch('/workspaces/{workspace:slug}/projects/{project:slug}/docs/{doc:slug}', [DocController::class, 'update'])->name('projects.docs.update');
Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/docs/{doc:slug}', [DocController::class, 'destroy'])->name('projects.docs.destroy');
```

### P1.7 DocTreeBuilder

```php
namespace App\Support;

use Illuminate\Support\Collection;

class DocTreeBuilder
{
    public static function buildTree(Collection $docs): array
    {
        $grouped = $docs->groupBy('parent_id');

        return self::buildBranch($grouped, null);
    }

    private static function buildBranch(Collection $grouped, ?int $parentId): array
    {
        return $grouped->get($parentId, collect())->map(fn ($doc) => [
            'id' => $doc->id,
            'title' => $doc->title,
            'slug' => $doc->slug,
            'parent_id' => $doc->parent_id,
            'sort_order' => $doc->sort_order,
            'created_at' => $doc->created_at,
            'updated_at' => $doc->updated_at,
            'author' => $doc->relationLoaded('author') ? [
                'id' => $doc->author->id,
                'name' => $doc->author->name,
                'avatar' => $doc->author->avatar,
            ] : null,
            'children' => self::buildBranch($grouped, $doc->id),
        ])->values()->toArray();
    }
}
```

### P1.8 Wayfinder

```bash
php artisan wayfinder:generate
```

---

## Phase 2 — Frontend

### P2.1 Types — `resources/js/types/docs.ts`

```typescript
export interface DocTreeItem {
    id: number;
    title: string;
    slug: string;
    parent_id: number | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
    author: { id: number; name: string; avatar: string | null } | null;
    children: DocTreeItem[];
}

export interface DocDetail extends DocTreeItem {
    content: string;
    project_id: number;
    breadcrumbs: Array<{ title: string; slug: string }>;
}

export interface DocForm {
    title: string;
    content: string;
    parent_id: number | null;
    slug: string;
}
```

### P2.2 i18n

**EN** (`resources/js/i18n/locales/en/translation.json`):
```json
"docs": {
    "title": "Docs",
    "new_doc": "New doc",
    "edit_doc": "Edit doc",
    "delete_doc": "Delete doc",
    "delete_confirm": "Delete this doc? This cannot be undone.",
    "delete_confirm_children": "Delete this doc and all its sub-pages?",
    "empty_title": "No docs yet",
    "empty_description": "Document your project — create the first doc.",
    "create_doc": "Create doc",
    "save_doc": "Save doc",
    "cancel": "Cancel",
    "doc_title": "Title",
    "doc_content": "Content",
    "parent_doc": "Parent doc",
    "none": "None (root page)",
    "last_edited": "Last edited by {name}",
    "created_by": "Created by {name}",
    "search_docs": "Search docs...",
    "uncollapse": "Expand all",
    "collapse": "Collapse all"
}
```

**ID** (`resources/js/i18n/locales/id/translation.json`):
```json
"docs": {
    "title": "Dokumen",
    "new_doc": "Dokumen baru",
    "edit_doc": "Edit dokumen",
    "delete_doc": "Hapus dokumen",
    "delete_confirm": "Hapus dokumen ini?",
    "delete_confirm_children": "Hapus dokumen ini dan semua sub-halamannya?",
    "empty_title": "Belum ada dokumen",
    "empty_description": "Dokumentasikan proyek Anda — buat dokumen pertama.",
    "create_doc": "Buat dokumen",
    "save_doc": "Simpan",
    "cancel": "Batal",
    "doc_title": "Judul",
    "doc_content": "Konten",
    "parent_doc": "Induk dokumen",
    "none": "Tidak ada (halaman root)",
    "last_edited": "Terakhir diedit oleh {name}",
    "created_by": "Dibuat oleh {name}",
    "search_docs": "Cari dokumen...",
    "uncollapse": "Buka semua",
    "collapse": "Tutup semua"
}
```

### P2.3 RichEditor — `resources/js/components/rich-editor.tsx`

```tsx
'use no memo';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Heading1, Heading2, Italic, List, ListOrdered } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export function RichEditor({ content, onChange, placeholder }: Props) {
    const { t } = useTranslation();

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Placeholder.configure({
                placeholder: placeholder ?? t('docs.doc_content'),
            }),
        ],
        content,
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
        editorProps: {
            attributes: {
                class:
                    'prose prose-sm max-w-none min-h-[300px] px-4 py-3 focus:outline-none',
            },
        },
    });

    if (!editor) return null;

    const ToolButton = ({ onClick, active, children }: { onClick: () => void; active: boolean; children: React.ReactNode }) => (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClick}
            className={cn('h-8 w-8 p-0', active && 'bg-accent text-accent-foreground')}
        >
            {children}
        </Button>
    );

    return (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5">
                <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
                    <Bold className="size-3.5" />
                </ToolButton>
                <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
                    <Italic className="size-3.5" />
                </ToolButton>
                <div className="mx-1 h-4 w-px bg-border" />
                <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })}>
                    <Heading1 className="size-3.5" />
                </ToolButton>
                <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>
                    <Heading2 className="size-3.5" />
                </ToolButton>
                <div className="mx-1 h-4 w-px bg-border" />
                <ToolButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
                    <List className="size-3.5" />
                </ToolButton>
                <ToolButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
                    <ListOrdered className="size-3.5" />
                </ToolButton>
            </div>
            <EditorContent editor={editor} />
        </div>
    );
}
```

### P2.4 Page — `projects/docs/index.tsx`

```
Structure:
┌──────────────────────────────────────────────────┐
│  PageHeader (back to project) + "New doc" button │
├──────────────────┬───────────────────────────────┤
│  Sidebar tree     │  Empty state                  │
│  (DocTreePanel)   │  "No docs yet"               │
└──────────────────┴───────────────────────────────┘
```

**Components:**
- `DocTreePanel` — recursive tree dengan collapse/expand
- `DocTreeItem` — single node: title + children recursive + active state

**Routes:**
- Doc name click → `router.visit(projectDocs.show({ ...params, doc: slug }))`
- "New doc" button → toggle inline form (title input + parent select + save)

### P2.5 Page — `projects/docs/show.tsx`

```
Structure:
┌──────────────────────────────────────────────────┐
│  PageHeader (back to docs index) + edit/delete   │
├──────────────────┬───────────────────────────────┤
│  Sidebar tree     │  Doc content:                 │
│  (DocTreePanel)   │  - Title (h1)                │
│                   │  - Meta: author, last edit    │
│                   │  - Content (rendered HTML)    │
│                   │  - Child pages list           │
│                   │                               │
│                   │  Edit mode (toggle):          │
│                   │  - Title input                │
│                   │  - RichEditor                 │
│                   │  - Parent doc select          │
│                   │  - Save / Cancel              │
└──────────────────┴───────────────────────────────┘
```

**Edit mode**:
- State `editing: boolean` — toggle by Edit button or pencil icon
- `router.patch()` → Wayfinder `projectDocs.update()`
- Cancel → revert content ke original

**Delete**:
- Confirm dialog (`ConfirmDialog` sudah ada)
- `router.delete()` → Wayfinder `projectDocs.destroy()`
- Redirect ke docs index setelah delete

### P2.6 Tab Trigger

Tambah di `TabsList` di `resources/js/pages/projects/show.tsx` (sebelum Automation):

```tsx
<TabsTrigger
    value="docs"
    onClick={() =>
        router.visit(
            docsIndex.url({
                workspace: workspace.slug,
                project: project.slug,
            }),
        )
    }
>
    <FileText className="size-4" />
    <span>{t('docs.title')}</span>
</TabsTrigger>
```

Import:
```typescript
import { index as docsIndex } from '@/routes/projects/docs';
import { FileText } from 'lucide-react';
```

### P2.7 Install TipTap

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-mention
```

---

## Phase 3 — Post-MVP

### P3.1 Version History

Table `doc_versions`:
```php
Schema::create('doc_versions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('doc_id')->constrained('docs')->cascadeOnDelete();
    $table->foreignId('edited_by')->constrained('users');
    $table->string('title');
    $table->longText('content');
    $table->timestamps();
});
```

Auto-save di `Doc`s `updated` event, load version list di sidebar, restore button.

### P3.2 Full-text Search

Route `GET .../docs/search?q=...` → `WHERE title LIKE ? OR content LIKE ?`. Dengan indeks full-text di MySQL, performa ok.

### P3.3 Task Embed

Parse `/task:PROJECT-NUMBER` di content → ganti jadi `<a>` ke task show page. Render di frontend dengan regex.

### P3.4 Templates

Seed default docs per project saat create:
- Meeting Notes
- Technical Specification
- Standard Operating Procedure

### P3.5 Drag Reorder

Pakai `@dnd-kit` yang sudah terinstall — `useSortable` untuk sort sidebar tree.

### P3.6 Export PDF

Route `GET .../docs/{doc}/pdf` → render Blade view + `barryvdh/laravel-dompdf` atau `spatie/browsershot`.

### P3.7 Per-doc Permissions

Tambahkan kolom `visibility` ke docs: `'workspace' | 'project' | 'restricted'`. Kalau restricted, butuh permission spesifik.

---

## File Manifest

| Phase | File | Aksi | Baris |
|-------|------|------|-------|
| 1.1 | `database/migrations/YYYY_MM_DD_HHMMSS_create_docs_table.php` | Baru | 30 |
| 1.2 | `app/Models/Doc.php` | Baru | 60 |
| 1.3 | `app/Policies/DocPolicy.php` | Baru | 50 |
| 1.3 | `app/Providers/AppServiceProvider.php` | Edit (+1 baris) | 1 |
| 1.4 | `app/Http/Requests/StoreDocRequest.php` | Baru | 40 |
| 1.5 | `app/Http/Controllers/DocController.php` | Baru | 140 |
| 1.6 | `routes/web.php` | Edit (+10 baris) | 10 |
| 1.7 | `app/Support/DocTreeBuilder.php` | Baru | 40 |
| 2.1 | `resources/js/types/docs.ts` | Baru | 25 |
| 2.2 | `resources/js/i18n/locales/en/translation.json` | Edit | 15 |
| 2.2 | `resources/js/i18n/locales/id/translation.json` | Edit | 15 |
| 2.3 | `resources/js/components/rich-editor.tsx` | Baru | 100 |
| 2.4 | `resources/js/pages/projects/docs/index.tsx` | Baru | 200 |
| 2.5 | `resources/js/pages/projects/docs/show.tsx` | Baru | 250 |
| 2.6 | `resources/js/pages/projects/show.tsx` | Edit | 12 |
| — | `package.json` | Edit (TipTap dep) | 1 |

**Total: 16 file (+11 baru, +5 edit), ~989 baris**

---

## Execution Order

```
Phase 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6 → 1.7 → 1.8
          ↘ 2.7     ↗
Phase 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6
```
