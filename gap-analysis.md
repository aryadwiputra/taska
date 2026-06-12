# Gap Analysis — Qeerja

> Generated: June 12, 2026
> Stack: PHP 8.3 / Laravel 13 / React 19 / Inertia v3 / Tailwind v4 / Pest 4

---

## ✅ Status: All Items Resolved

### 🔴 High — Authorization Gaps

All controller endpoints are now covered by either FormRequest `authorize()` or controller-level `Gate::authorize()`:

| Controller | Method | Mechanism | Status |
|------------|--------|-----------|--------|
| `TaskController` | `store()` | `StoreTaskRequest::authorize()` | ✅ |
| `TaskController` | `update()` | `UpdateTaskRequest::authorize()` | ✅ |
| `TaskController` | `show()` | `Gate::authorize('view', $task)` | ✅ |
| `TaskController` | `destroy()` | `Gate::authorize('delete', $task)` | ✅ |
| `TaskController` | `moveColumn()` | `MoveTaskColumnRequest::authorize()` | ✅ |
| `ProjectMemberController` | `store()` | `StoreProjectMemberRequest::authorize()` | ✅ |
| `ProjectMemberController` | `update()` | `UpdateProjectMemberRequest::authorize()` | ✅ |
| `ProjectMemberController` | `destroy()` | `Gate::authorize('manageMembers', $project)` | ✅ |
| `WorkspaceMemberController` | `store()` | `StoreWorkspaceMemberRequest::authorize()` | ✅ |
| `WorkspaceMemberController` | `update()` | `UpdateWorkspaceMemberRequest::authorize()` | ✅ |
| `WorkspaceMemberController` | `destroy()` | `Gate::authorize('manageMembers', $workspace)` | ✅ |
| `LabelController` | `store()` | `StoreLabelRequest::authorize()` | ✅ |
| `LabelController` | `update()` | `UpdateLabelRequest::authorize()` | ✅ |
| `LabelController` | `show()` | `Gate::authorize('view', $project)` | ✅ |
| `LabelController` | `destroy()` | `Gate::authorize('update', $project)` | ✅ |
| `SprintController` | `store()` | `StoreSprintRequest::authorize()` | ✅ |
| `SprintController` | `update()` | `UpdateSprintRequest::authorize()` | ✅ |
| `SprintController` | `show()` | `Gate::authorize('view', $project)` | ✅ |
| `SprintController` | `destroy()` | `Gate::authorize('update', $project)` | ✅ |
| `SprintController` | `addTask()` | `Gate::authorize('update', $project)` | ✅ |
| `SprintController` | `removeTask()` | `Gate::authorize('update', $project)` | ✅ |
| `EpicController` | `show()` | `Gate::authorize('view', $project)` | ✅ |
| `EpicController` | `addTask()` | `Gate::authorize('update', $project)` | ✅ |
| `EpicController` | `removeTask()` | `Gate::authorize('update', $project)` | ✅ |
| `EpicController` | `destroy()` | `Gate::authorize('update', $project)` | ✅ |
| `BoardColumnController` | `store()` | `StoreBoardColumnRequest::authorize()` | ✅ |
| `BoardColumnController` | `update()` | `UpdateBoardColumnRequest::authorize()` | ✅ |
| `BoardColumnController` | `reorder()` | `ReorderBoardColumnsRequest::authorize()` | ✅ |
| `BoardColumnController` | `destroy()` | `Gate::authorize('update', $board)` | ✅ |
| `TaskTypeController` | `store()` | `StoreTaskTypeRequest::authorize()` | ✅ |
| `TaskTypeController` | `update()` | `UpdateTaskTypeRequest::authorize()` | ✅ |
| `TaskTypeController` | `destroy()` | `Gate::authorize('update', $workspace)` | ✅ |
| `PriorityController` | `store()` | `StorePriorityRequest::authorize()` | ✅ |
| `PriorityController` | `update()` | `UpdatePriorityRequest::authorize()` | ✅ |
| `PriorityController` | `destroy()` | `Gate::authorize('update', $workspace)` | ✅ |
| `TaskAttachmentController` | `store()` | `StoreAttachmentRequest::authorize()` | ✅ |
| `TaskAttachmentController` | `destroy()` | `Gate::authorize('update', $task)` | ✅ |
| `GitHubAuthController` | `callback()` | `$user->can('update', $project)` | ✅ |

### 🟡 Medium — Bug Fixes

| File | Line | Issue | Fix | Status |
|------|------|-------|-----|--------|
| `settings.tsx` | 1290 | Epics tab posts to `sprintStore()` instead of `epicStore()` | Changed to `epicStore()` | ✅ Fixed |

### 🟢 Low Impact

| Item | Detail | Status |
|------|--------|--------|
| 6 unused shadcn components | `collapsible`, `icon`, `placeholder-pattern`, `toggle`, `toggle-group`, `input-otp` | Not imported |
| Thin DashboardTest | Only 2 tests (guest redirect + auth access) | Not addressed |
| Test naming `CommentTest.php` | Instead of `TaskCommentTest.php` | Not addressed |

### Others Fixed Earlier

| Item | File(s) |
|------|---------|
| GitHub OAuth TypeError | `GitHubAuthController.php` |
| N+1 in NotificationService | `NotificationService.php` |
| Auth bypass EpicController@show | `EpicController.php` |
| Auto-close UX (board_column_id) | `ProcessGitHubWebhookJob.php` |
| Webhook dedup via Cache | `GitHubWebhookController.php`, `ProcessGitHubWebhookJob.php` |
