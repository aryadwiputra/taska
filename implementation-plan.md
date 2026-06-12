# Implementation Plan — Qeerja Gap Analysis

> Generated: June 12, 2026
> Stack: PHP 8.3 / Laravel 13 / React 19 / Inertia v3 / Tailwind v4 / Pest 4

---

## Completed Features

| Feature | Backend | Frontend | Tests |
|---|---|---|---|
| Auth (login, register, 2FA, passkeys, forgot/reset password, verify email) | ✅ | ✅ | ✅ |
| Workspaces CRUD + members + settings | ✅ | ✅ | ✅ |
| Projects CRUD + members + settings | ✅ | ✅ | ✅ |
| Boards + Columns CRUD | ✅ | ✅ (settings) | ✅ |
| Epics CRUD | ✅ | ✅ (settings + show page) | ✅ |
| Sprints CRUD | ✅ | ✅ (settings + show page) | ✅ |
| Labels CRUD | ✅ | ✅ (settings + show page list) | ⚠️ partial |
| Task Types CRUD (workspace) | ✅ | ✅ (workspace settings) | ❌ |
| Priorities CRUD (workspace) | ✅ | ✅ (workspace settings) | ❌ |
| Tasks CRUD + move/reorder + relations + watchers + parent/child | ✅ | ✅ | ✅ |
| Comments + Attachments | ✅ | ✅ | ⚠️ partial |
| Activity Log + Notifications | ✅ | ✅ | ❌ |
| Dashboard + My Tasks | ✅ | ✅ | ❌ |
| User settings (profile, security, appearance) | ✅ | ✅ | ❌ |
| Board kanban view (drag-and-drop) | ✅ | ✅ | ❌ |

---

## Phase 1 — Epic & Sprint Dialogs on Show Page

**Goal:** Users can create, edit, and delete epics/sprints directly from the project show page, without navigating to Settings.

### Files to Create

| File | Description |
|---|---|
| `resources/js/components/epic-dialog.tsx` | Dialog for create/edit epic. Fields: name, summary, status (planned/active/completed), start date, due date, description. Pattern: `ProjectMemberDialog` |
| `resources/js/components/sprint-dialog.tsx` | Dialog for create/edit sprint. Fields: name, goal, status (planned/active/completed/cancelled), start date, end date. Pattern: `ProjectMemberDialog` |
| `resources/js/components/confirm-dialog.tsx` | Reusable confirmation dialog to replace `window.confirm()`. Uses Radix Dialog. Props: title, description, confirmText (default "Delete"), variant (destructive), onConfirm |

### Files to Modify

| File | Changes |
|---|---|
| `resources/js/pages/projects/show.tsx` | Epics tab: add "Create Epic" button, edit pencil icon per epic card, delete button → open `EpicDialog` / `ConfirmDialog`. Sprints tab: same pattern with `SprintDialog`. Remove "Edit in settings" links |

### Patterns to Follow

- Dialog open/close state via React `useState` + `onOpenChange`
- Forms use Inertia `<Form>` component with `resetOnSuccess`
- Delete via `router.delete()` inside `ConfirmDialog.onConfirm`
- All URLs use Wayfinder (migrate from hardcoded strings)

### Acceptance Criteria

- [ ] "Create Epic" button on Epics tab opens dialog → POST creates epic → list refreshes
- [ ] Edit icon on each epic opens dialog pre-filled → PUT updates epic
- [ ] Delete icon on each epic opens ConfirmDialog → DELETE removes epic
- [ ] Same for Sprints with SprintDialog
- [ ] Toast notification on success/error
- [ ] All existing data still renders correctly
- [ ] Tests pass

---

## Phase 2 — Labels Tab on Show Page

**Goal:** Labels management accessible from show page, not just Settings.

### Files to Create

| File | Description |
|---|---|
| `resources/js/components/label-dialog.tsx` | Dialog for create/edit label. Fields: name, color (color picker or preset swatches). Pattern: `ProjectMemberDialog` |

### Files to Modify

| File | Changes |
|---|---|
| `resources/js/pages/projects/show.tsx` | Add "Labels" tab between Sprints and Timeline. Grid of label cards with color dot, name, slug, task count badge, edit/delete buttons |

### Backend Changes

| File | Changes |
|---|---|
| `app/Http/Controllers/LabelController.php` | `index` method — include `tasks_count` for badge display |

### Acceptance Criteria

- [ ] Labels tab visible on show page
- [ ] Grid shows all project labels with color, name, task count
- [ ] Create/edit/delete works via dialogs
- [ ] Labels tab in Settings page continues to work

---

## Phase 3 — Board Page Improvements

**Goal:** Board selector for switching boards + column management from board page.

### Files to Modify

| File | Changes |
|---|---|
| `resources/js/pages/projects/board.tsx` | Add board selector dropdown in header (switch between project boards). Add "Manage Columns" button → inline panel or dialog for column CRUD |
| `app/Http/Controllers/BoardController.php` | `show` — return all project boards (not just default) so selector can render |
| `resources/js/components/board-column-dialog.tsx` (NEW) | Dialog for column create/edit. Fields: name, color, position |

### Acceptance Criteria

- [ ] Board selector shows all boards in project, switching loads correct board
- [ ] "Manage Columns" opens column management
- [ ] Can add, rename, delete, reorder columns
- [ ] Default board cannot be deleted
- [ ] Last column cannot be deleted

---

## Phase 4 — Model Factories

**Goal:** Every model has a factory for test consistency.

### Files to Create

| Factory | Key States |
|---|---|
| `database/factories/EpicFactory.php` | `planned`, `active`, `completed` |
| `database/factories/SprintFactory.php` | `planned`, `active`, `completed`, `cancelled` |
| `database/factories/LabelFactory.php` | (default state only) |
| `database/factories/TaskCommentFactory.php` | (default state only) |
| `database/factories/TaskAttachmentFactory.php` | (default state only) |
| `database/factories/WorkspaceMemberFactory.php` | `admin`, `manager`, `member` roles |
| `database/factories/ProjectMemberFactory.php` | `lead`, `manager`, `member`, `viewer` roles |

### Patterns

- Use `recycle()` to share workspace/project instances
- Follow existing factory conventions in `database/factories/`
- Define `$attributes` defaults matching migration column defaults

---

## Phase 5 — Test Coverage

**Goal:** Every controller endpoint has a corresponding Pest test.

### Priority Order

| Test File | Key Scenarios |
|---|---|
| `tests/Feature/EpicTest.php` | CRUD, addTask, removeTask, authorization |
| `tests/Feature/SprintTest.php` | CRUD, addTask, removeTask, authorization |
| `tests/Feature/LabelTest.php` | CRUD, unique slug, authorization |
| `tests/Feature/TaskCommentTest.php` | create, update, delete, authorization |
| `tests/Feature/TaskAttachmentTest.php` | upload, delete, authorization |
| `tests/Feature/TaskTypeTest.php` | CRUD, reorder, authorization |
| `tests/Feature/PriorityTest.php` | CRUD, reorder, authorization |
| `tests/Feature/WorkspaceMemberTest.php` | add, remove, change role, authorization |
| `tests/Feature/ProjectMemberTest.php` | add, remove, change role, authorization |
| `tests/Feature/NotificationTest.php` | list, mark read, mark all read |
| `tests/Feature/DashboardTest.php` | page loads, shows user tasks |

### Patterns

- Use `RefreshDatabase` trait per test file (not auto-applied)
- Use factories from Phase 4 instead of manual model creation
- Use Pest helpers: `actingAs()`, `get()`, `post()`, `put()`, `delete()`
- Gate authorization tests: confirm 403 for unauthorized roles

---

## Phase 6 — Frontend Polish

**Goal:** Polish existing UI for production quality.

| Task | Detail |
|---|---|
| Loading skeletons | Deferred props + skeleton components for lazy sections |
| Error boundaries | Per-page error boundaries with retry |
| Responsive layout | Mobile hamburger menu, stacked tables, single-column kanban |
| Dark mode consistency | Audit all pages for dark mode color vars |
| Keyboard shortcuts | `n` new task, `g b` go to board, `g l` go to list, etc. |
| Wayfinder migration | Replace all hardcoded URL strings with Wayfinder imports |

---

## Phase 7 — Future Features (Post-MVP)

| Feature | Notes |
|---|---|
| Bulk task operations | Move column, change assignee, delete, archive |
| Task search across projects | Global search with filters |
| User mentions (`@username`) in comments | Mentions + notification |
| Webhooks / integrations | Slack, Discord, GitHub |
| Calendar / Gantt timeline | Full calendar view with drag-to-schedule |
| Reports & analytics | Burndown chart, velocity, cycle time |
| File preview | Image preview, PDF viewer for attachments |

---

## File Change Summary

### New Files (8)
```
resources/js/components/epic-dialog.tsx
resources/js/components/sprint-dialog.tsx
resources/js/components/label-dialog.tsx
resources/js/components/confirm-dialog.tsx
resources/js/components/board-column-dialog.tsx
database/factories/EpicFactory.php
database/factories/SprintFactory.php
database/factories/LabelFactory.php
database/factories/TaskCommentFactory.php
database/factories/TaskAttachmentFactory.php
database/factories/WorkspaceMemberFactory.php
database/factories/ProjectMemberFactory.php
```

### Modified Files (6+)
```
resources/js/pages/projects/show.tsx
resources/js/pages/projects/board.tsx
resources/js/pages/projects/settings.tsx
app/Http/Controllers/LabelController.php
app/Http/Controllers/BoardController.php
```

### New Test Files (11)
```
tests/Feature/EpicTest.php
tests/Feature/SprintTest.php
tests/Feature/LabelTest.php
tests/Feature/TaskCommentTest.php
tests/Feature/TaskAttachmentTest.php
tests/Feature/TaskTypeTest.php
tests/Feature/PriorityTest.php
tests/Feature/WorkspaceMemberTest.php
tests/Feature/ProjectMemberTest.php
tests/Feature/NotificationTest.php
tests/Feature/DashboardTest.php
```
