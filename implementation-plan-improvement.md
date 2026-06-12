# Implementation Plan Improvement — Phase 7 Post-MVP

> Generated: June 12, 2026
> Source: `implementation-plan.md` Phase 7
> Stack: PHP 8.3 / Laravel 13 / React 19 / Inertia v3 / Tailwind v4 / Pest 4 / Wayfinder

---

## Executive Summary

Phase 7 should be implemented as a set of production improvements on top of the current MVP, not as a rewrite. The existing codebase already has the core primitives needed for most post-MVP features:

| Existing Capability | Current State | Phase 7 Leverage |
|---|---|---|
| Tasks | CRUD, board movement, assignees, labels, epics, sprints, watchers, parent/child, soft deletes, `archived_at` | Bulk operations, global search, reports, calendar/Gantt |
| Comments | Create/update/delete, threaded replies via `parent_id` | User mentions and mention notifications |
| Attachments | Upload/delete, disk/path/mime/size metadata | File preview and secure downloads |
| Activity | `activity_logs` and per-task `task_activities` | Reports, audit trail, webhooks |
| Notifications | Custom notifications table with read state | Mentions, assignments, webhooks feedback |
| Projects/Workspaces | Scoped routes, members, settings | Permissions, integrations, reporting scope |
| Board/Sprints/Epics | Kanban columns, sprint/epic task pivots | Calendar/Gantt, velocity, burndown |

Recommended implementation order:

1. Bulk task operations
2. Task search across projects
3. User mentions in comments
4. File preview
5. Calendar/Gantt timeline
6. Reports and analytics
7. Webhooks and integrations

This order prioritizes immediate user value, reuses existing models, and builds lower-level capabilities before more complex integrations.

---

## Current Gap Analysis

### Strengths

- `Task` already has `archived_at`, `deleted_at`, `board_column_id`, `priority_id`, `assignees`, `labels`, `epics`, `sprints`, `watchers`, and relations.
- Project-scoped routes are consistent under `/workspaces/{workspace:slug}/projects/{project:slug}`.
- `TaskActivityService` and `NotificationService` already exist and should be reused for new side effects.
- Inertia + Wayfinder patterns are established for frontend/backend route coupling.
- Attachments store `disk`, `file_path`, `mime_type`, and `file_size`, enough for previews.

### Weaknesses To Address First

- No dedicated bulk operation endpoint or request validation.
- No global task search endpoint/page across projects.
- No normalized mention data, so mentions cannot be queried, deduplicated, or marked as notified.
- Attachments are exposed through storage URLs, but there is no preview/download controller with authorization.
- Reports need additional aggregation queries and likely task history semantics.
- Webhooks need persistence, signing, retries, delivery logs, and event selection.

---

## Phase 7.1 — Bulk Task Operations

**Goal:** Users can select multiple tasks and perform common actions safely in one request.

### Scope

| Operation | Detail |
|---|---|
| Move column | Move selected tasks to a board column and update `status` from column key |
| Change assignee | Add, remove, or replace assignees |
| Change priority | Set or clear priority |
| Change labels | Add, remove, or replace labels |
| Archive | Set `archived_at` for selected tasks |
| Delete | Soft-delete selected tasks |

### Backend Changes

| File | Change |
|---|---|
| `app/Http/Controllers/TaskBulkOperationController.php` (new) | `store()` endpoint for validated bulk actions |
| `app/Http/Requests/StoreTaskBulkOperationRequest.php` (new) | Validate `task_ids`, `operation`, and operation-specific payload |
| `app/Services/TaskBulkOperationService.php` (new) | Apply operations in a transaction and emit activity/notifications |
| `routes/web.php` | Add `POST /workspaces/{workspace:slug}/projects/{project:slug}/tasks/bulk` |
| `app/Policies/TaskPolicy.php` | Confirm/update bulk authorization semantics |

### Frontend Changes

| File | Change |
|---|---|
| `resources/js/pages/projects/show.tsx` | Add row selection to list tab, bulk toolbar, selected count |
| `resources/js/pages/projects/board.tsx` | Optional multi-select cards for later iteration |
| `resources/js/components/task-bulk-toolbar.tsx` (new) | Shared bulk action UI |
| `resources/js/components/task-bulk-dialog.tsx` (new) | Dialog for operation-specific input |
| `resources/js/routes/**` | Regenerate Wayfinder after route addition |

### Data Rules

- Limit one bulk request to 100 tasks to keep transactions predictable.
- All selected tasks must belong to the scoped project.
- Operation should be atomic: if one task fails validation/authorization, none are changed.
- Record one high-level activity log and per-task task activity entries.

### Tests

| Test File | Scenarios |
|---|---|
| `tests/Feature/TaskBulkOperationTest.php` | Move, assign, priority, labels, archive, delete, invalid project task, unauthorized member, max task limit |

### Acceptance Criteria

- [ ] Users can select multiple tasks from project list view.
- [ ] Bulk toolbar appears only when tasks are selected.
- [ ] Bulk operations update all selected tasks atomically.
- [ ] Activity entries are created for changed tasks.
- [ ] Unauthorized users receive 403.
- [ ] Wayfinder routes are used in React.

---

## Phase 7.2 — Task Search Across Projects

**Goal:** Users can search tasks across all accessible workspaces/projects with filters.

### Scope

| Filter | Detail |
|---|---|
| Text | Search `code`, `title`, `description` |
| Workspace | Current/all accessible workspaces |
| Project | Accessible projects |
| Status | Task status/board column key |
| Assignee | Assigned user |
| Reporter | Reporting user |
| Priority | Priority level/key |
| Label | Project labels |
| Date | Due date, updated date, created date ranges |
| State | Open, completed, archived |

### Backend Changes

| File | Change |
|---|---|
| `app/Http/Controllers/TaskSearchController.php` (new) | Render global task search page |
| `app/Http/Requests/SearchTasksRequest.php` (new) | Validate filter query params |
| `app/Queries/TaskSearchQuery.php` (new) | Encapsulate Eloquent filtering/sorting |
| `routes/web.php` | Add `GET /tasks/search` named `tasks.search` |

### Frontend Changes

| File | Change |
|---|---|
| `resources/js/pages/tasks/search.tsx` (new) | Search UI with filter sidebar and result list |
| `resources/js/components/task-search-filters.tsx` (new) | Filter controls |
| `resources/js/components/task-search-result.tsx` (new) | Result row/card |
| `resources/js/components/app-sidebar.tsx` | Add Search nav item or command entry |

### Performance Notes

- Start with database-backed `LIKE` search for SQLite compatibility.
- Add indexes for high-cardinality filters if missing: `tasks.updated_at`, `tasks.archived_at`, relevant pivot indexes.
- Keep result pagination server-side.
- Consider Laravel Scout only after MVP search usage proves database search insufficient.

### Tests

| Test File | Scenarios |
|---|---|
| `tests/Feature/TaskSearchTest.php` | Search by code/title, filters, inaccessible projects excluded, archived filter, pagination |

### Acceptance Criteria

- [ ] Search returns only tasks visible to the authenticated user.
- [ ] Query and filters are reflected in URL query params.
- [ ] Results link/open task detail drawer or project task route.
- [ ] Empty state and loading state exist.

---

## Phase 7.3 — User Mentions In Comments

**Goal:** Users can mention project members in comments with `@username` or `@name`, and mentioned users receive notifications.

### Backend Changes

| File | Change |
|---|---|
| `database/migrations/*_create_comment_mentions_table.php` (new) | Store comment/user mention relationships |
| `app/Models/CommentMention.php` (new) | Mention pivot model if metadata is needed |
| `app/Models/TaskComment.php` | Add `mentions()` relation |
| `app/Services/MentionParser.php` (new) | Parse mention tokens and resolve users within project scope |
| `app/Services/MentionNotificationService.php` (new) | Notify mentioned users and prevent self-notification duplicates |
| `TaskCommentController@store/update` | Parse mentions after validation and persist mention rows |

### Suggested Schema

| Table | Columns |
|---|---|
| `comment_mentions` | `id`, `task_comment_id`, `user_id`, `notified_at`, timestamps |

### Frontend Changes

| File | Change |
|---|---|
| `resources/js/components/task-comment.tsx` | Render highlighted mention spans |
| `resources/js/components/task-detail-drawer.tsx` | Comment input mention autocomplete |
| `resources/js/components/mention-autocomplete.tsx` (new) | Lightweight member suggestion popup |

### Rules

- Only project members can be mentioned.
- Mention resolution should be stable by user ID, not display name only.
- Editing a comment should add new mentions and keep historical mention rows unless explicitly removed.
- Mention notifications should not notify the comment author.

### Tests

| Test File | Scenarios |
|---|---|
| `tests/Feature/CommentMentionTest.php` | Mention project member, reject non-member, no self-notification, edit adds mention, notification created |

### Acceptance Criteria

- [ ] Typing `@` shows project member suggestions.
- [ ] Mentioned users receive notifications.
- [ ] Mentions render as highlighted text in comments.
- [ ] Non-project users cannot be mentioned.

---

## Phase 7.4 — File Preview

**Goal:** Users can preview task attachments in-app without downloading first.

### Backend Changes

| File | Change |
|---|---|
| `app/Http/Controllers/TaskAttachmentPreviewController.php` (new) | Authorized inline preview/download response |
| `routes/web.php` | Add preview and download routes under task attachments |
| `app/Models/TaskAttachment.php` | Add helpers: `isImage()`, `isPdf()`, `isPreviewable()` |
| `app/Http/Requests/StoreAttachmentRequest.php` | Confirm allowed MIME types and size limits |

### Frontend Changes

| File | Change |
|---|---|
| `resources/js/components/attachment-preview-dialog.tsx` (new) | Dialog/sheet preview surface |
| `resources/js/components/task-detail-drawer.tsx` | Add preview button/thumbs for attachments |

### Preview Matrix

| MIME Type | Behavior |
|---|---|
| `image/*` | Inline image preview with fit/zoom basics |
| `application/pdf` | Browser iframe/object preview with download fallback |
| text files | Optional read-only text preview later |
| other files | Download-only state |

### Security Notes

- Do not expose raw storage paths as the primary access mechanism for private files.
- Always authorize attachment access through task/project membership.
- Set safe response headers: `Content-Disposition`, `Content-Type`, and no sniffing for unknown files.

### Tests

| Test File | Scenarios |
|---|---|
| `tests/Feature/TaskAttachmentPreviewTest.php` | Owner/member can preview, outsider forbidden, missing file handled, download headers |

### Acceptance Criteria

- [ ] Image attachments open in a preview dialog.
- [ ] PDF attachments preview or show browser-supported fallback.
- [ ] Unauthorized users cannot access preview/download URLs.
- [ ] Non-previewable files show download action only.

---

## Phase 7.5 — Calendar / Gantt Timeline

**Goal:** Visualize project work by date and allow scheduling adjustments.

### Scope Split

| Iteration | Detail |
|---|---|
| Calendar v1 | Month/week agenda based on task `start_date` and `due_date` |
| Timeline v1 | Horizontal grouped timeline by epic/sprint/status |
| Gantt v2 | Drag-to-schedule and dependency visualization |

### Backend Changes

| File | Change |
|---|---|
| `app/Http/Controllers/ProjectCalendarController.php` (new) | Project calendar page data |
| `app/Http/Controllers/ProjectTimelineController.php` (new) | Timeline/Gantt page data |
| `app/Http/Requests/UpdateTaskScheduleRequest.php` (new) | Validate schedule changes |
| `TaskController` or new `TaskScheduleController` | Patch task start/due dates |
| `routes/web.php` | Add calendar/timeline routes |

### Frontend Changes

| File | Change |
|---|---|
| `resources/js/pages/projects/calendar.tsx` (new) | Calendar view |
| `resources/js/pages/projects/timeline.tsx` (new) | Timeline/Gantt view |
| `resources/js/components/task-calendar-card.tsx` (new) | Task representation in calendar |
| `resources/js/components/task-timeline-row.tsx` (new) | Timeline row |

### Data Rules

- Tasks without dates appear in an “Unscheduled” section.
- Dragging a task updates `start_date` and/or `due_date` through a dedicated schedule endpoint.
- Parent tasks/epics should be display grouping only in v1; avoid auto-rescheduling children until v2.

### Tests

| Test File | Scenarios |
|---|---|
| `tests/Feature/ProjectCalendarTest.php` | Page loads, date range filter, hidden inaccessible tasks |
| `tests/Feature/TaskScheduleTest.php` | Update dates, invalid range rejected, unauthorized rejected |

### Acceptance Criteria

- [ ] Project calendar route shows scheduled tasks.
- [ ] Unscheduled tasks are visible.
- [ ] Users can update schedule with authorization.
- [ ] Timeline groups by sprint/epic/status.

---

## Phase 7.6 — Reports & Analytics

**Goal:** Provide actionable project metrics: burndown, velocity, cycle time, throughput, overdue trends.

### Report Types

| Report | Data Source | Notes |
|---|---|---|
| Burndown | sprint tasks + `completed_at` | Best for active/completed sprints |
| Velocity | completed sprint task count or story points later | Start with task count |
| Cycle time | task creation/start/completion timestamps | Requires clear status transition semantics |
| Throughput | completed tasks by period | Project-level trend |
| Aging WIP | tasks in non-done columns by age | Uses `created_at`, status/columns |

### Backend Changes

| File | Change |
|---|---|
| `app/Http/Controllers/ProjectReportController.php` (new) | Reports page |
| `app/Queries/Reports/BurndownQuery.php` (new) | Burndown aggregation |
| `app/Queries/Reports/VelocityQuery.php` (new) | Velocity aggregation |
| `app/Queries/Reports/CycleTimeQuery.php` (new) | Cycle time aggregation |
| `routes/web.php` | Add `GET /workspaces/{workspace}/projects/{project}/reports` |

### Frontend Changes

| File | Change |
|---|---|
| `resources/js/pages/projects/reports.tsx` (new) | Reports dashboard |
| `resources/js/components/reports/*.tsx` (new) | Small chart cards/tables |

### Implementation Notes

- Start with CSS/SVG/simple table charts to avoid adding chart dependencies without approval.
- If chart dependency is approved later, use a single library consistently.
- Prefer query classes for report calculations so tests can cover logic directly.

### Tests

| Test File | Scenarios |
|---|---|
| `tests/Feature/ProjectReportTest.php` | Page loads, data scoped to project, unauthorized rejected |
| `tests/Unit/Reports/*Test.php` | Aggregation correctness for burndown/velocity/cycle time |

### Acceptance Criteria

- [ ] Reports page shows at least burndown, velocity, and throughput.
- [ ] Metrics exclude inaccessible projects/tasks.
- [ ] Empty-state reports are useful for new projects.
- [ ] Aggregation logic is unit-tested.

---

## Phase 7.7 — Webhooks / Integrations

**Goal:** Workspaces/projects can send signed event payloads to external services such as Slack, Discord, GitHub, or custom endpoints.

### Recommended Scope

Start with generic outgoing webhooks before platform-specific integrations.

| Event | Payload |
|---|---|
| `task.created` | task, project, workspace, actor |
| `task.updated` | task, changed fields, actor |
| `task.moved` | task, old/new column/status, actor |
| `comment.created` | task, comment, actor |
| `attachment.created` | task, attachment metadata, actor |
| `sprint.completed` | sprint summary |

### Backend Changes

| File | Change |
|---|---|
| `database/migrations/*_create_webhooks_table.php` (new) | Webhook endpoint config |
| `database/migrations/*_create_webhook_deliveries_table.php` (new) | Delivery attempts/logs |
| `app/Models/Webhook.php` (new) | Endpoint config model |
| `app/Models/WebhookDelivery.php` (new) | Delivery log model |
| `app/Http/Controllers/WebhookController.php` (new) | CRUD for webhook configs |
| `app/Jobs/DeliverWebhook.php` (new) | Async delivery with retries |
| `app/Services/WebhookDispatcher.php` (new) | Event-to-payload dispatch |
| `app/Services/WebhookSigner.php` (new) | HMAC signature generation |

### Suggested Schema

| Table | Key Columns |
|---|---|
| `webhooks` | `workspace_id`, `project_id` nullable, `name`, `url`, `secret`, `events`, `is_active`, timestamps |
| `webhook_deliveries` | `webhook_id`, `event`, `payload`, `status_code`, `response_body`, `attempts`, `delivered_at`, `failed_at`, timestamps |

### Frontend Changes

| File | Change |
|---|---|
| `resources/js/pages/workspaces/settings.tsx` | Workspace webhook settings tab |
| `resources/js/pages/projects/settings.tsx` | Optional project-specific webhooks tab |
| `resources/js/components/webhook-dialog.tsx` (new) | Create/edit webhook endpoint |
| `resources/js/components/webhook-delivery-list.tsx` (new) | Delivery history |

### Security & Reliability

- Encrypt webhook secret at rest if possible.
- Sign every request with `X-Qeerja-Signature` using HMAC SHA-256.
- Use queued jobs with retry/backoff.
- Set explicit HTTP timeout and connect timeout.
- Redact secrets from logs and UI after creation.
- Disable endpoint after repeated failures only after explicit threshold.

### Platform Integrations Later

| Integration | Later Scope |
|---|---|
| Slack | Incoming webhook templates, task created/comment created |
| Discord | Incoming webhook templates |
| GitHub | Link PR/issue URLs to tasks, optional commit mention parsing |

### Tests

| Test File | Scenarios |
|---|---|
| `tests/Feature/WebhookTest.php` | CRUD, authorization, event selection validation |
| `tests/Feature/WebhookDeliveryTest.php` | queued delivery, signed payload, retry/failure logging |
| `tests/Unit/WebhookSignerTest.php` | deterministic signature generation |

### Acceptance Criteria

- [ ] Workspace admins can create/edit/delete webhook endpoints.
- [ ] Selected events trigger queued deliveries.
- [ ] Deliveries are signed and logged.
- [ ] Failed deliveries retry and expose failure details.

---

## Cross-Cutting Requirements

### Authorization

- Every new route must authorize against workspace/project membership and task policies.
- Bulk operations must authorize all selected tasks before mutation.
- Search and reports must never leak inaccessible project/task names.

### Activity & Notifications

- Reuse `TaskActivityService` for task-level changes.
- Reuse `NotificationService` for assignee/watch/mention notifications.
- Add one high-level `ActivityLog` entry for major bulk and integration changes.

### Wayfinder

- Add routes first, then run `php artisan wayfinder:generate --with-form --no-interaction`.
- React code must import from `@/routes` or `@/actions`; no hardcoded internal URLs.

### Inertia & React

- Use deferred props for heavy report/search/calendar datasets.
- Use skeleton states for slow sections.
- Keep URL query params as source of truth for search/report filters.
- Preserve SSR compatibility.

### Database & Performance

- Add indexes with migrations for new high-volume filters.
- Keep report queries scoped by project/workspace first.
- Use pagination for search results and delivery logs.
- Avoid loading all tasks for reports; aggregate in SQL/query classes.

### Testing

- Every phase must include Pest feature tests.
- Query/report logic should have unit tests when it contains non-trivial aggregation.
- Use factories and `RefreshDatabase` per test file.
- Run minimum verification per phase: `vendor/bin/pint --dirty --format agent`, `npm run types:check`, targeted `php artisan test --compact`.

---

## Consolidated File Plan

### New Backend Files

```text
app/Http/Controllers/TaskBulkOperationController.php
app/Http/Controllers/TaskSearchController.php
app/Http/Controllers/ProjectCalendarController.php
app/Http/Controllers/ProjectTimelineController.php
app/Http/Controllers/ProjectReportController.php
app/Http/Controllers/TaskAttachmentPreviewController.php
app/Http/Controllers/WebhookController.php
app/Http/Requests/StoreTaskBulkOperationRequest.php
app/Http/Requests/SearchTasksRequest.php
app/Http/Requests/UpdateTaskScheduleRequest.php
app/Jobs/DeliverWebhook.php
app/Models/CommentMention.php
app/Models/Webhook.php
app/Models/WebhookDelivery.php
app/Queries/TaskSearchQuery.php
app/Queries/Reports/BurndownQuery.php
app/Queries/Reports/VelocityQuery.php
app/Queries/Reports/CycleTimeQuery.php
app/Services/MentionParser.php
app/Services/MentionNotificationService.php
app/Services/TaskBulkOperationService.php
app/Services/WebhookDispatcher.php
app/Services/WebhookSigner.php
```

### New Frontend Files

```text
resources/js/pages/tasks/search.tsx
resources/js/pages/projects/calendar.tsx
resources/js/pages/projects/timeline.tsx
resources/js/pages/projects/reports.tsx
resources/js/components/task-bulk-toolbar.tsx
resources/js/components/task-bulk-dialog.tsx
resources/js/components/task-search-filters.tsx
resources/js/components/task-search-result.tsx
resources/js/components/mention-autocomplete.tsx
resources/js/components/attachment-preview-dialog.tsx
resources/js/components/task-calendar-card.tsx
resources/js/components/task-timeline-row.tsx
resources/js/components/reports/burndown-card.tsx
resources/js/components/reports/velocity-card.tsx
resources/js/components/reports/throughput-card.tsx
resources/js/components/webhook-dialog.tsx
resources/js/components/webhook-delivery-list.tsx
```

### New Test Files

```text
tests/Feature/TaskBulkOperationTest.php
tests/Feature/TaskSearchTest.php
tests/Feature/CommentMentionTest.php
tests/Feature/TaskAttachmentPreviewTest.php
tests/Feature/ProjectCalendarTest.php
tests/Feature/TaskScheduleTest.php
tests/Feature/ProjectReportTest.php
tests/Feature/WebhookTest.php
tests/Feature/WebhookDeliveryTest.php
tests/Unit/Reports/BurndownQueryTest.php
tests/Unit/Reports/VelocityQueryTest.php
tests/Unit/Reports/CycleTimeQueryTest.php
tests/Unit/WebhookSignerTest.php
```

---

## Suggested Milestones

| Milestone | Features | Estimated Risk |
|---|---|---|
| 7A | Bulk task operations + tests | Medium |
| 7B | Global task search + filters | Medium |
| 7C | Mentions + mention notifications | Medium |
| 7D | File preview + authorized downloads | Low/Medium |
| 7E | Calendar/timeline v1 | Medium/High |
| 7F | Reports v1 | High |
| 7G | Generic webhooks + delivery logs | High |

---

## Definition Of Done For Phase 7

- [ ] Every new backend endpoint has feature test coverage.
- [ ] Every new route is generated through Wayfinder and used without hardcoded internal URLs.
- [ ] All new pages support dark mode and responsive layouts.
- [ ] Heavy pages use pagination, deferred props, or server-side aggregation.
- [ ] Authorization is enforced for every workspace/project/task-scoped action.
- [ ] Activity and notifications remain consistent with existing app behavior.
- [ ] `npm run types:check`, `npm run lint:check`, and targeted Pest tests pass per milestone.
