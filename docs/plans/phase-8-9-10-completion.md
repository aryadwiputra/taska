# Phase 8–10: Feature Completion Plan

## Overview

Remaining features to reach full Jira parity. 10 features organized into 3 phases.

| Phase | Features | Est. Days |
|-------|----------|-----------|
| 8 | Sprint Start/Close, Inline Edit, Components, SLA, Workload | 12–16 |
| 9 | Cross-Project Planning, Git Integration Full, Goal/OKR | 8–10 |
| 10 | No-Code Automation, Approval Flow | 8–10 |

**Total: 28–36 working days**

---

## Phase 8: Core Parity

### 8.1 Sprint Start/Close Logic + Sprint Report

**Goal**: Enforce sprint lifecycle rules and provide a per-sprint report.

#### Backend

**Migration: none needed** — `sprints` table already has `status`, `start_date`, `end_date`, `completed_at`.

**`SprintController` changes:**

```php
// New methods
public function start(Request $request, Workspace $workspace, Project $project, Sprint $sprint): RedirectResponse
public function close(Request $request, Workspace $workspace, Project $project, Sprint $sprint): RedirectResponse
public function report(Workspace $workspace, Project $project, Sprint $sprint): Response|JsonResponse
```

**`start()` logic:**
1. Guard: status must be `planned`
2. Guard: only one sprint can be `active` per project — if another is active, throw ValidationException
3. Set `status = 'active'`, `start_date = now()` (if null)
4. Save

**`close()` logic:**
1. Guard: status must be `active`
2. Set `status = 'completed'`, `completed_at = now()`, `end_date = now()` (if null)
3. Save

**`report()` logic:**
1. Load sprint with tasks (assignees, priority, taskType, boardColumn)
2. Compute per-day burndown (same algorithm as `ReportsController@burndown` but for this sprint)
3. Compute: total story points, completed story points, tasks by status, tasks by assignee, completion rate
4. Return Inertia page `projects/sprints/report` or JSON

**Routes** (add to `routes/web.php` inside project scope):
```php
Route::post('/sprints/{sprint}/start', [SprintController::class, 'start'])->name('sprints.start');
Route::post('/sprints/{sprint}/close', [SprintController::class, 'close'])->name('sprints.close');
Route::get('/sprints/{sprint}/report', [SprintController::class, 'report'])->name('sprints.report');
```

#### Frontend

**`sprints/show.tsx` changes:**
- Add "Start Sprint" button (visible when `status === 'planned'`)
- Add "Complete Sprint" button (visible when `status === 'active'`)
- Add "View Report" link (visible when `status === 'completed'`)
- Both buttons use `router.post` with confirmation dialog

**New page: `resources/js/pages/projects/sprints/report.tsx`**
- Two-column layout
- Left: burndown chart (SVG), story points breakdown, completion stats
- Right: tasks by status table, tasks by assignee table
- Sprint header: name, date range, goal, status badge

#### Testing

- `SprintControllerTest`: test start transitions, close transitions, guard rules (can't start non-planned, can't close non-active, only one active sprint)
- `SprintReportTest`: test report data accuracy (burndown points, completed counts)

---

### 8.2 List View Inline Edit

**Goal**: Edit task fields directly in the table rows without opening the drawer.

#### Backend

**No changes** — existing `TaskController@update` already handles field updates via PATCH.

#### Frontend

**`projects/show.tsx` (list tab) changes:**

The existing TanStack Table columns become editable:

| Column | Edit Control |
|--------|-------------|
| Status | `Select` dropdown (on click of current badge) |
| Priority | `Select` dropdown |
| Assignees | `MultiSelect` dropdown (search members) |
| Story Points | `Input` (number, on click) |
| Due Date | `DatePicker` (on click) |
| Sprint | `Select` dropdown |

**Implementation approach:**
1. Add `useEditableRow` hook: manages which cell is currently editing (`editingCell: { taskId, field }`)
2. Each editable cell renders a display mode (text/badge) or edit mode (input/select)
3. On blur or Enter, submit via `fetch()` PATCH to `taskUpdate.url(...)` with the single field
4. Optimistic update: update local state immediately, rollback on error
5. Click outside closes edit mode
6. Keyboard: Escape cancels, Enter confirms

**New component: `resources/js/components/editable-cell.tsx`**
```tsx
function EditableCell<T>({ value, field, taskId, render Display, renderEdit, onSave })
```

#### Testing

- Frontend typecheck
- Manual: click status cell → dropdown opens → select new status → row updates
- Manual: click due date → datepicker opens → select date → row updates

---

### 8.3 Components System

**Goal**: Categorize tasks by UI/backend components (like Jira Components).

#### Backend

**Migration: `create_components_table`**
```php
Schema::create('components', function (Blueprint $table) {
    $table->id();
    $table->foreignId('project_id')->constrained()->cascadeOnDelete();
    $table->string('name');
    $table->string('description')->nullable();
    $table->string('lead_id')->nullable(); // user who leads this component
    $table->timestamps();
    $table->unique(['project_id', 'name']);
});

Schema::create('component_task', function (Blueprint $table) {
    $table->id();
    $table->foreignId('component_id')->constrained()->cascadeOnDelete();
    $table->foreignId('task_id')->constrained()->cascadeOnDelete();
    $table->timestamps();
    $table->unique(['component_id', 'task_id']);
});
```

**Model: `app/Models/Component.php`**
```php
class Component extends Model
{
    protected $fillable = ['project_id', 'name', 'description', 'lead_id'];

    public function project(): BelongsTo { return $this->belongsTo(Project::class); }
    public function lead(): BelongsTo { return $this->belongsTo(User::class, 'lead_id'); }
    public function tasks(): BelongsToMany { return $this->belongsToMany(Task::class, 'component_task'); }
}
```

**`Task` model:** add `components()` BelongsToMany relationship.

**Controller: `app/Http/Controllers/ComponentController.php`**
- `index`: list components for project (with tasks_count)
- `store`: create component (authorize: project member)
- `update`: update component
- `destroy`: delete component (detach tasks, don't cascade delete tasks)
- `addTask`: attach task to component
- `removeTask`: detach task from component

**Routes:**
```php
Route::apiResource('components', ComponentController::class);
Route::post('/components/{component}/tasks', [ComponentController::class, 'addTask']);
Route::delete('/components/{component}/tasks', [ComponentController::class, 'removeTask']);
```

#### Frontend

**New page: `resources/js/pages/projects/components/index.tsx`**
- Card grid of components with name, description, lead, task count
- Create/edit/delete dialogs
- Click component → shows task list filtered by that component

**`task-detail-drawer.tsx` and `tasks/show.tsx`:**
- Add "Components" field in sidebar
- Multi-select dropdown to assign components

**`projects/show.tsx`:**
- Add "Components" tab to project page

#### Testing

- `ComponentControllerTest`: CRUD + addTask/removeTask
- Model factory: `Component::factory()`
- `Task` model test: `components()` relationship

---

### 8.4 SLA Internal

**Goal**: Track response time and resolution time per task type.

#### Backend

**Migration: `create_sla_policies_table`**
```php
Schema::create('sla_policies', function (Blueprint $table) {
    $table->id();
    $table->foreignId('project_id')->constrained()->cascadeOnDelete();
    $table->foreignId('task_type_id')->constrained()->cascadeOnDelete();
    $table->integer('response_hours'); // target first response time
    $table->integer('resolution_hours'); // target resolution time
    $table->boolean('enabled')->default(true);
    $table->timestamps();
    $table->unique(['project_id', 'task_type_id']);
});
```

**Migration: add `first_responded_at` to tasks**
```php
Schema::table('tasks', function (Blueprint $table) {
    $table->timestamp('first_responded_at')->nullable()->after('completed_at');
});
```

**Model: `app/Models/SlaPolicy.php`**
```php
class SlaPolicy extends Model
{
    protected $fillable = ['project_id', 'task_type_id', 'response_hours', 'resolution_hours', 'enabled'];
    public function project(): BelongsTo { ... }
    public function taskType(): BelongsTo { ... }
}
```

**`Task` model:** add `slaPolicy()` relationship (via taskType), add `responseTime()` and `resolutionTime()` computed attributes.

**SlaCheckJob** (queued, runs every 5 minutes via scheduler):
1. Query tasks where `first_responded_at IS NULL` and `created_at + response_hours < now()` → SLA breach (response)
2. Query tasks where `completed_at IS NULL` and `created_at + resolution_hours < now()` → SLA breach (resolution)
3. Store breaches in `sla_breaches` table (task_id, policy_id, breach_type, breached_at)
4. Notify assignees on breach

**Controller: `app/Http/Controllers/SlaPolicyController.php`**
- `index`: list SLA policies for project
- `store`: create/update SLA policy
- `destroy`: delete SLA policy

**Routes:**
```php
Route::apiResource('sla-policies', SlaPolicyController::class);
```

#### Frontend

**`resources/js/pages/projects/settings/sla.tsx`**
- Table of SLA policies: task type, response hours, resolution hours, enabled toggle
- Create/edit dialog
- Project settings page gets an "SLA" tab

**`task-detail-drawer.tsx` and `tasks/show.tsx`:**
- Show SLA status badge: "On Track" (green), "At Risk" (yellow), "Breached" (red)
- Show time remaining or time over

**`reports-tab.tsx`:**
- Add SLA compliance card: % of tasks meeting response/resolution targets

#### Testing

- `SlaPolicyControllerTest`: CRUD
- `SlaCheckJobTest`: test breach detection logic
- `SlaPolicy` model test

---

### 8.5 Workload/Capacity Page

**Goal**: Dedicated page showing team workload and capacity planning.

#### Backend

**Migration: add `capacity_hours` to project_members**
```php
Schema::table('project_members', function (Blueprint $table) {
    $table->integer('capacity_hours')->nullable(); // weekly capacity in hours
});
```

**Controller: `app/Http/Controllers/WorkloadController.php`**
```php
public function index(Workspace $workspace, Project $project): Response|JsonResponse
```
Returns:
- All project members with their tasks (grouped by sprint or unassigned)
- Per-member: total story points, total tasks, tasks by status
- Per-member: capacity hours (if set)
- Sprint-level: total committed points, total capacity

**Routes:**
```php
Route::get('/workload', [WorkloadController::class, 'index'])->name('workload');
```

#### Frontend

**New page: `resources/js/pages/projects/workload.tsx`**
- Team member cards in a grid
- Each card: avatar, name, task count, story points, capacity bar
- Tasks grouped by sprint within each card
- Drag-and-drop: move tasks between members
- Filter by sprint, status
- Capacity indicator: green (under), yellow (at), red (over)

**`projects/show.tsx`:**
- Add "Workload" tab

#### Testing

- `WorkloadControllerTest`: test response data structure
- Frontend typecheck

---

## Phase 9: Advanced Features

### 9.1 Cross-Project Planning

**Goal**: View tasks and epics across multiple projects.

#### Backend

**Migration: add `project_id` nullable to epics**
```php
Schema::table('epics', function (Blueprint $table) {
    $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
});
```
(Epics can optionally be scoped to a project, or be workspace-level.)

**New controller: `app/Http/Controllers/CrossProjectController.php`**
```php
public function timeline(Workspace $workspace): Response // cross-project gantt
public function board(Workspace $workspace): Response     // cross-project board
```

**Routes:**
```php
Route::get('/cross-project/timeline', [CrossProjectController::class, 'timeline'])->name('cross-project.timeline');
Route::get('/cross-project/board', [CrossProjectController::class, 'board'])->name('cross-project.board');
```

#### Frontend

**New pages:**
- `resources/js/pages/workspaces/cross-project/timeline.tsx` — Gantt spanning multiple projects
- `resources/js/pages/workspaces/cross-project/board.tsx` — Kanban board with project swimlanes

**Workspace sidebar:** add "Cross-Project" section with Timeline and Board links

#### Testing

- `CrossProjectControllerTest`: test data aggregation across projects
- Frontend typecheck

---

### 9.2 Git Integration Full

**Goal**: Branch creation from UI, PR status badges, structured commit display.

#### Backend

**`TaskController` new method:**
```php
public function createBranch(Request $request, Workspace $workspace, Project $project, Task $task): JsonResponse
```
1. Get GitHub integration for project
2. Create branch `{project_key}-{task_number}-{slugify(title)}` from default branch via GitHub API
3. Return branch URL

**`Task` model:** add `githubBranch` accessor that returns the branch name pattern.

**`Integration` model:** add `githubApi()` method that returns an authenticated `GuzzleHttp\Client` for GitHub API calls.

#### Frontend

**`task-detail-drawer.tsx` and `tasks/show.tsx`:**
- "Create Branch" button (visible when GitHub integration is connected)
- Branch name display: `{PROJ-123}-fix-login-bug`
- Linked PRs section: show PR title, status (open/merged/closed), author
- Commits section: structured list of linked commits (sha, message, author, date)

**New component: `resources/js/components/git-info.tsx`**
- `BranchInfo`: branch name, create button
- `PullRequestBadge`: PR status icon + link
- `CommitList`: list of commits linked to this task

#### Testing

- `TaskController@createBranchTest`: mock GitHub API, test branch creation
- Frontend typecheck

---

### 9.3 Goal/OKR Mapping

**Goal**: Define objectives and key results, map them to epics/tasks.

#### Backend

**Migration: `create_goals_table`**
```php
Schema::create('goals', function (Blueprint $table) {
    $table->id();
    $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
    $table->string('title');
    $table->text('description')->nullable();
    $table->enum('status', ['active', 'completed', 'cancelled'])->default('active');
    $table->date('target_date')->nullable();
    $table->timestamps();
});

Schema::create('key_results', function (Blueprint $table) {
    $table->id();
    $table->foreignId('goal_id')->constrained()->cascadeOnDelete();
    $table->string('title');
    $table->enum('status', ['not_started', 'in_progress', 'achieved'])->default('not_started');
    $table->decimal('current_value', 10, 2)->default(0);
    $table->decimal('target_value', 10, 2)->default(100);
    $table->timestamps();
});

Schema::create('epic_goals', function (Blueprint $table) {
    $table->id();
    $table->foreignId('epic_id')->constrained()->cascadeOnDelete();
    $table->foreignId('goal_id')->constrained()->cascadeOnDelete();
    $table->timestamps();
    $table->unique(['epic_id', 'goal_id']);
});
```

**Models:**
- `Goal`: hasMany KeyResults, belongsToMany Epic
- `KeyResult`: belongsTo Goal
- `Epic`: belongsToMany Goal (via epic_goals)

**Controller: `app/Http/Controllers/GoalController.php`**
- CRUD for goals and key results
- `addEpic` / `removeEpic`: link/unlink epics to goals

**Routes:**
```php
Route::apiResource('goals', GoalController::class);
Route::post('/goals/{goal}/epics', [GoalController::class, 'addEpic']);
Route::delete('/goals/{goal}/epics/{epic}', [GoalController::class, 'removeEpic']);
```

#### Frontend

**New page: `resources/js/pages/workspaces/goals/index.tsx`**
- Goal cards with progress bars (key results progress)
- Create/edit/delete dialogs
- Link epics to goals

**New page: `resources/js/pages/workspaces/goals/show.tsx`**
- Goal detail with key results list
- Linked epics list
- Progress chart

**Workspace sidebar:** add "Goals" link

**`epics/show.tsx`:**
- Show linked goals in epic detail

#### Testing

- `GoalControllerTest`: CRUD + addEpic/removeEpic
- `Goal` and `KeyResult` model tests
- Factory: `Goal::factory()`, `KeyResult::factory()`

---

## Phase 10: Enterprise Features

### 10.1 No-Code Automation

**Goal**: Create rules like "When status changes to X, assign to Y" without code.

#### Backend

**Migration: `create_automation_rules_table`**
```php
Schema::create('automation_rules', function (Blueprint $table) {
    $table->id();
    $table->foreignId('project_id')->constrained()->cascadeOnDelete();
    $table->string('name');
    $table->boolean('enabled')->default(true);
    $table->string('trigger_event'); // e.g., 'task.status_changed', 'task.created', 'task.due_date_passed'
    $table->json('conditions'); // [{field: 'status', operator: 'equals', value: 'done'}]
    $table->json('actions'); // [{type: 'assign', value: 'user:5'}, {type: 'add_label', value: 'label:3'}]
    $table->integer('priority')->default(0);
    $table->timestamps();
});
```

**Model: `app/Models/AutomationRule.php`**
```php
class AutomationRule extends Model
{
    protected $fillable = ['project_id', 'name', 'enabled', 'trigger_event', 'conditions', 'actions', 'priority'];
    protected $casts = ['conditions' => 'array', 'actions' => 'array', 'enabled' => 'boolean'];
    public function project(): BelongsTo { ... }
}
```

**AutomationEngine service:**
```php
class AutomationEngine
{
    public function handleTaskEvent(Task $task, string $event, array $changes = []): void
    {
        $rules = AutomationRule::where('project_id', $task->project_id)
            ->where('trigger_event', $event)
            ->where('enabled', true)
            ->orderBy('priority', 'desc')
            ->get();

        foreach ($rules as $rule) {
            if ($this->conditionsMatch($task, $rule->conditions, $changes)) {
                $this->executeActions($task, $rule->actions);
            }
        }
    }
}
```

**Trigger events:**
- `task.created`
- `task.status_changed`
- `task.priority_changed`
- `task.assignee_added`
- `task.due_date_passed` (via scheduled command)

**Actions:**
- `assign` → set assignee
- `add_label` → add label
- `remove_label` → remove label
- `set_priority` → set priority
- `move_to_column` → move to board column
- `send_notification` → send in-app notification
- `add_comment` → add comment

**Controller: `app/Http/Controllers/AutomationRuleController.php`**
- CRUD for rules
- `test`: preview which tasks would match (dry run)

**Routes:**
```php
Route::apiResource('automation-rules', AutomationRuleController::class);
Route::post('/automation-rules/{rule}/test', [AutomationRuleController::class, 'test']);
```

**Scheduler:** `automation:check-due-dates` command runs daily, triggers `task.due_date_passed` for overdue tasks.

#### Frontend

**New page: `resources/js/pages/projects/automation/index.tsx`**
- Rule list: name, trigger, conditions summary, actions summary, enabled toggle
- Create/edit dialog with:
  - Trigger selector (dropdown)
  - Conditions builder (field + operator + value, add multiple)
  - Actions builder (type + value, add multiple)
- Test button: shows matching tasks preview

**`projects/show.tsx`:**
- Add "Automation" tab

#### Testing

- `AutomationRuleControllerTest`: CRUD + test
- `AutomationEngineTest`: test condition matching, action execution
- `AutomationCheckDueDatesTest`: test scheduled command

---

### 10.2 Approval Flow

**Goal**: Require approval before tasks can be moved to certain statuses.

#### Backend

**Migration: `create_approval_flows_table`**
```php
Schema::create('approval_flows', function (Blueprint $table) {
    $table->id();
    $table->foreignId('project_id')->constrained()->cascadeOnDelete();
    $table->string('name');
    $table->foreignId('column_id')->constrained('board_columns')->cascadeOnDelete(); // target column
    $table->json('required_approvers'); // [{type: 'role', value: 'admin'}, {type: 'user', value: 5}]
    $table->integer('min_approvals')->default(1);
    $table->boolean('enabled')->default(true);
    $table->timestamps();
});

Schema::create('task_approvals', function (Blueprint $table) {
    $table->id();
    $table->foreignId('task_id')->constrained()->cascadeOnDelete();
    $table->foreignId('approval_flow_id')->constrained()->cascadeOnDelete();
    $table->foreignId('approver_id')->constrained('users');
    $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
    $table->text('comment')->nullable();
    $table->timestamps();
    $table->unique(['task_id', 'approval_flow_id', 'approver_id']);
});
```

**Models:**
- `ApprovalFlow`: belongsTo Project, belongsTo BoardColumn, hasMany TaskApprovals
- `TaskApproval`: belongsTo Task, belongsTo ApprovalFlow, belongsTo User (approver)

**TaskController changes:**
- `moveColumn` method: before moving, check if target column has an approval flow
- If approval required and not yet approved, create `TaskApproval` records (pending) instead of moving
- If all required approvals are met, allow the move

**Controller: `app/Http/Controllers/ApprovalFlowController.php`**
- CRUD for approval flows
- `approve`: approve a pending task approval
- `reject`: reject a pending task approval

**Routes:**
```php
Route::apiResource('approval-flows', ApprovalFlowController::class);
Route::post('/tasks/{task}/approve', [ApprovalFlowController::class, 'approve']);
Route::post('/tasks/{task}/reject', [ApprovalFlowController::class, 'reject']);
```

#### Frontend

**New page: `resources/js/pages/projects/settings/approvals.tsx`**
- List of approval flows: name, target column, required approvers, enabled toggle
- Create/edit dialog

**`task-detail-drawer.tsx` and `tasks/show.tsx`:**
- "Pending Approval" badge when task has pending approvals
- Approve/Reject buttons (visible to authorized users)
- Approval history section

**Board view:**
- When dragging to an approval-required column, show confirmation dialog explaining approval is needed

#### Testing

- `ApprovalFlowControllerTest`: CRUD + approve/reject
- `TaskController@moveColumnTest`: test approval gate logic
- `ApprovalFlow` and `TaskApproval` model tests

---

## Implementation Order

| # | Feature | Phase | Est. Days | Dependencies |
|---|---------|-------|-----------|--------------|
| 8.1 | Sprint Start/Close + Report | 8 | 2–3 | — |
| 8.2 | List View Inline Edit | 8 | 2–3 | — |
| 8.3 | Components System | 8 | 2–3 | — |
| 8.4 | SLA Internal | 8 | 2–3 | — |
| 8.5 | Workload/Capacity Page | 8 | 2–3 | — |
| 9.1 | Cross-Project Planning | 9 | 3–4 | — |
| 9.2 | Git Integration Full | 9 | 2–3 | — |
| 9.3 | Goal/OKR Mapping | 9 | 3–4 | — |
| 10.1 | No-Code Automation | 10 | 4–5 | — |
| 10.2 | Approval Flow | 10 | 4–5 | — |

**Recommended batch commits:** One commit per feature, similar to Phase 7 approach.

---

## Database Changes Summary

### New Tables
```sql
-- 8.3 Components
components (id, project_id, name, description, lead_id, timestamps)
component_task (id, component_id, task_id, timestamps)

-- 8.4 SLA
sla_policies (id, project_id, task_type_id, response_hours, resolution_hours, enabled, timestamps)
sla_breaches (id, task_id, policy_id, breach_type, breached_at, timestamps)

-- 9.3 Goals
goals (id, workspace_id, title, description, status, target_date, timestamps)
key_results (id, goal_id, title, status, current_value, target_value, timestamps)
epic_goals (id, epic_id, goal_id, timestamps)

-- 10.1 Automation
automation_rules (id, project_id, name, enabled, trigger_event, conditions, actions, priority, timestamps)

-- 10.2 Approval
approval_flows (id, project_id, name, column_id, required_approvers, min_approvals, enabled, timestamps)
task_approvals (id, task_id, approval_flow_id, approver_id, status, comment, timestamps)
```

### Modified Tables
```sql
-- 8.4 SLA
tasks ADD COLUMN first_responded_at TIMESTAMP NULL;

-- 8.5 Workload
project_members ADD COLUMN capacity_hours INT NULL;

-- 9.1 Cross-Project
epics MODIFY COLUMN project_id BIGINT NULL;
```

---

## Testing Strategy

- **Per feature**: 1 feature test file + model tests + factory
- **Minimum coverage**: Controller endpoints (CRUD + business logic), model relationships, job logic
- **Frontend**: typecheck + lint per feature
- **Integration**: run full suite after each feature commit (`php artisan test --compact`)
- **Pint**: `vendor/bin/pint --dirty --format agent` after each PHP change
