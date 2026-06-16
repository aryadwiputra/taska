# Phase 7: Jira Parity — Top 5 Features

## Overview

Feature prioritization berdasarkan impact untuk mencapai Jira-level functionality. Setiap feature dirancang untuk incremental delivery — bisa diimplementasi dan di-deploy secara terpisah.

---

## Feature 1: Story Points + Velocity Charts

**Goal**: Tim bisa estimasi effort task dan track velocity per sprint untuk capacity planning.

### Backend

- Migration: tambah kolom `story_points` (integer, nullable) ke `tasks` table
- Migration: tambah kolom `committed_points` (integer, nullable) ke `sprints` table
- Model: tambah `storyPoints` cast di `Task` model
- Model: tambah `committedPoints` cast di `Sprint` model
- `TaskController@update`: handle `story_points` field
- `SprintController@store`/`update`: handle `committed_points` field
- `ReportsController`: tambah velocity chart computation (total completed story points per sprint)

### Frontend

- Task detail drawer: tambah story points input (fibonacci picker: 1,2,3,5,8,13,?)
- Sprint detail: tampilkan committed vs completed story points
- Board card: tampilkan story points badge
- Reports tab: tambah Velocity Chart component (bar chart per sprint)
- Sprint planning: tampilkan total story points saat drag task ke sprint

### API Changes

- `TaskController@update` — accept `story_points`
- `SprintController@store`/`update` — accept `committed_points`
- `ReportsController@burndown` — extend response dengan velocity data

---

## Feature 2: Backlog View

**Goal**: Dedicated view untuk task grooming, prioritas, dan drag-to-rank.

### Backend

- `TaskController@index`: tambah query param `backlog=true` untuk return tasks tanpa sprint, ordered by position
- `TaskController@update`: handle `position` update untuk ranking
- Route: `GET /workspaces/{slug}/projects/{slug}/backlog`

### Frontend

- New page: `resources/js/pages/projects/backlog.tsx`
- Split view: left panel = backlog tasks (unscheduled), right panel = sprint tasks
- Drag-and-drop: drag task dari backlog ke sprint (dan sebaliknya)
- Drag-to-rank: reorder task dalam backlog untuk prioritas
- Task card: tampilkan code, title, story points, assignee, priority
- Filter bar: filter by assignee, type, priority, label
- Bulk select: pilih multiple task, pindah ke sprint sekaligus

### Components

- `BacklogTaskList` — sortable list of unscheduled tasks
- `SprintTaskList` — sortable list of sprint tasks
- `BacklogToolbar` — filter + bulk actions

---

## Feature 3: Swimlanes + WIP Limits

**Goal**: Board lebih powerful dengan grouping dan batasan work-in-progress.

### Backend

- Migration: tambah kolom `wip_limit` (integer, nullable) ke `board_columns` table
- Model: tambah `wipLimit` cast di `BoardColumn` model
- `BoardColumnController@update`: handle `wip_limit` field
- `BoardColumnController@store`: handle `wip_limit` field

### Frontend

- Board column header: tampilkan WIP limit badge (current/max), warna merah jika over limit
- Board settings: toggle swimlane mode (off, by epic, by assignee, by priority)
- Swimlane rendering: group tasks dalam kolom berdasarkan swimlane key
- Swimlane collapsible: bisa expand/collapse per group
- Drag-and-drop: tetap berfungsi antar swimlane dan kolom
- WIP limit warning: toast/block saat user coba add task ke kolom yang sudah full

### Components

- `SwimlaneGroup` — wrapper untuk task group dalam swimlane mode
- `WipLimitBadge` — badge di column header
- `BoardSwimlaneToggle` — toggle button di board toolbar

---

## Feature 4: Saved Filters

**Goal**: User bisa simpan filter favorit dan akses dengan cepat.

### Backend

- Migration: buat `saved_filters` table (user_id, name, filters JSON, is_shared boolean)
- Model: `SavedFilter` model
- Controller: `SavedFilterController` — CRUD untuk saved filters
- Route: `GET/POST/PUT/DELETE /settings/filters`

### Frontend

- Settings page: `settings/filters.tsx` — manage saved filters
- Search page: dropdown "Load saved filter" di toolbar
- Board view: dropdown "Quick filters" di toolbar
- Save current filter: tombol "Save filter" di search/board toolbar
- Filter naming: modal untuk input nama filter
- Shared filters: toggle untuk share filter dengan workspace members

### Components

- `SavedFilterDropdown` — dropdown untuk load saved filter
- `SaveFilterModal` — modal untuk save current filter
- `FilterBadge` — tampilkan active saved filter name

---

## Feature 5: Releases / Versions

**Goal**: Track versi rilis dan associasi task ke versi untuk release management.

### Backend

- Migration: buat `releases` table (project_id, name, description, status [planned/in_progress/released], released_at, due_date)
- Migration: tambah kolom `release_id` (nullable FK) ke `tasks` table
- Model: `Release` model dengan hasMany tasks
- Model: tambah `release` relationship di `Task` model
- Controller: `ReleaseController` — CRUD + add/remove tasks
- Route: `GET/POST/PUT/DELETE /workspaces/{slug}/projects/{slug}/releases`

### Frontend

- New page: `resources/js/pages/projects/releases/index.tsx` — list of releases
- New page: `resources/js/pages/projects/releases/show.tsx` — release detail with task list
- Project show: tambah "Releases" tab
- Task detail drawer: tambah release selector
- Release dashboard: total tasks, completed tasks, progress bar, burndown per release
- Board card: tampilkan release badge (opsional)

### Components

- `ReleaseCard` — card untuk release di list view
- `ReleaseProgress` — progress bar (completed/total tasks)
- `ReleaseSelector` — dropdown untuk assign task ke release

---

## Implementation Order

| Phase | Feature | Estimasi | Dependencies |
|-------|---------|----------|--------------|
| 7.1 | Story Points + Velocity | 2-3 hari | — |
| 7.2 | Backlog View | 3-4 hari | Story Points (7.1) |
| 7.3 | Swimlanes + WIP Limits | 2-3 hari | — |
| 7.4 | Saved Filters | 1-2 hari | — |
| 7.5 | Releases / Versions | 2-3 hari | — |

**Total estimasi: 10-15 hari kerja**

---

## Database Changes Summary

### New Tables

```sql
-- Saved Filters (Phase 7.4)
CREATE TABLE saved_filters (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    filters JSON NOT NULL,
    is_shared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Releases (Phase 7.5)
CREATE TABLE releases (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    status ENUM('planned', 'in_progress', 'released') DEFAULT 'planned',
    released_at TIMESTAMP NULL,
    due_date DATE NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

### Modified Tables

```sql
-- Tasks: add story_points, release_id
ALTER TABLE tasks ADD COLUMN story_points INT NULL AFTER position;
ALTER TABLE tasks ADD COLUMN release_id BIGINT NULL AFTER priority_id;
ALTER TABLE tasks ADD FOREIGN KEY (release_id) REFERENCES releases(id) ON DELETE SET NULL;

-- Sprints: add committed_points
ALTER TABLE sprints ADD COLUMN committed_points INT NULL AFTER end_date;

-- Board Columns: add wip_limit
ALTER TABLE board_columns ADD COLUMN wip_limit INT NULL AFTER is_done_column;
```

---

## Testing Strategy

- Unit tests untuk model relationships dan computed properties
- Feature tests untuk controller endpoints
- Frontend type checking + lint
- Manual testing: drag-and-drop, swimlane toggle, WIP limit warning
- E2E testing untuk critical flows (sprint planning, backlog grooming)
