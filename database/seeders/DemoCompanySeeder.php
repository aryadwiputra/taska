<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\ApprovalFlow;
use App\Models\AutomationRule;
use App\Models\Board;
use App\Models\BoardColumn;
use App\Models\Doc;
use App\Models\DocVersion;
use App\Models\Epic;
use App\Models\Goal;
use App\Models\Knowledge\Article;
use App\Models\Knowledge\Category;
use App\Models\Label;
use App\Models\NotificationRule;
use App\Models\Project;
use App\Models\Release;
use App\Models\SavedFilter;
use App\Models\SlaPolicy;
use App\Models\Sprint;
use App\Models\Task;
use App\Models\TaskActivity;
use App\Models\TaskApproval;
use App\Models\TaskComment;
use App\Models\TaskRelation;
use App\Models\User;
use App\Models\Workspace;
use App\Services\SettingService;
use App\Services\WorkspaceRoleService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Seeds a complete, coherent fictional SaaS company ("Svara") used for
 * live product screenshots on the landing page.
 *
 * Run: php artisan db:seed --class=DemoCompanySeeder
 */
class DemoCompanySeeder extends Seeder
{
    /** @var array<string, User> */
    protected array $users = [];

    protected Workspace $workspace;

    /** @var array<string, Project> */
    protected array $projects = [];

    /** @var array<string, Board> */
    protected array $boards = [];

    /** @var array<string, array<string, BoardColumn>> */
    protected array $columns = [];

    /** @var array<string, int> task-type / priority ids keyed by key */
    protected array $types = [];

    protected array $priorities = [];

    /** @var array<string, int> per-project task counters */
    protected array $counters = [];

    /** @var array<string, int> per-column position counters */
    protected array $positions = [];

    public function run(): void
    {
        if (Workspace::where('slug', 'svara')->exists()) {
            $this->command->warn('Workspace "svara" already exists. Skipping DemoCompanySeeder.');

            return;
        }

        DB::transaction(function () {
            $this->seedTeam();
            $this->seedProjects();
            $this->seedTaxonomy();
            $this->seedSprintsAndTasks();
            $this->seedCollaboration();
            $this->seedDelivery();
            $this->seedGovernance();
            $this->seedKnowledge();
            $this->seedActivity();
        });

        $this->command->info('Demo company "Svara" seeded. Login: rina@svara.id / SvaraDemo123!');
    }

    protected function seedTeam(): void
    {
        $roleService = app(WorkspaceRoleService::class);

        $team = [
            ['Rina Prasetya', 'rina@svara.id', 'owner'],
            ['Bagas Nugroho', 'bagas@svara.id', 'admin'],
            ['Sinta Maharani', 'sinta@svara.id', 'member'],
            ['Dimas Prasetyo', 'dimas@svara.id', 'member'],
            ['Maya Kusuma', 'maya@svara.id', 'member'],
            ['Fajar Ramadhan', 'fajar@svara.id', 'member'],
            ['Lina Hartono', 'lina@svara.id', 'member'],
            ['Rizky Pratama', 'rizky@svara.id', 'member'],
        ];

        foreach ($team as [$name, $email, $role]) {
            $this->users[$email] = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make('SvaraDemo123!'),
                'locale' => 'en',
                'email_verified_at' => now(),
            ]);
            $this->wsRoles[$email] = $role;
        }

        $this->workspace = Workspace::create([
            'owner_id' => $this->users['rina@svara.id']->id,
            'name' => 'Svara',
            'slug' => 'svara',
            'description' => 'Svara — subscription billing SaaS for Southeast Asian startups.',
        ]);

        $roleService->ensureRoles($this->workspace);

        foreach ($this->users as $email => $user) {
            $role = $this->wsRoles[$email];
            $this->workspace->members()->create([
                'user_id' => $user->id,
                'role' => $role,
                'status' => 'active',
            ]);
            $roleService->syncRole($user, $this->workspace, $role);
        }

        // Workspace::created auto-seeds task types + priorities; index them by key.
        foreach ($this->workspace->taskTypes as $type) {
            $this->types[$type->key] = $type->id;
        }
        foreach ($this->workspace->priorities as $priority) {
            $this->priorities[$priority->key] = $priority->id;
        }
    }

    protected function seedProjects(): void
    {
        $rina = $this->users['rina@svara.id'];

        $defs = [
            'SVRA' => [
                'name' => 'Svara App', 'slug' => 'svara-app', 'color' => '#2563EB',
                'description' => 'The core Svara billing platform — web app, API, and workers.',
                'members' => [
                    'rina@svara.id' => ['lead', 20], 'bagas@svara.id' => ['lead', 40],
                    'sinta@svara.id' => ['member', 40], 'dimas@svara.id' => ['member', 32],
                    'maya@svara.id' => ['member', 32], 'fajar@svara.id' => ['member', 32],
                    'lina@svara.id' => ['member', 20], 'rizky@svara.id' => ['member', 40],
                ],
            ],
            'SVWB' => [
                'name' => 'Company Website', 'slug' => 'company-website', 'color' => '#16A34A',
                'description' => 'Marketing site, blog, and public docs for svara.id.',
                'members' => [
                    'rina@svara.id' => ['lead', 10], 'dimas@svara.id' => ['member', 8],
                    'maya@svara.id' => ['member', 8], 'fajar@svara.id' => ['member', null],
                ],
            ],
        ];

        foreach ($defs as $key => $def) {
            $project = $this->workspace->projects()->create([
                'created_by' => $rina->id,
                'name' => $def['name'],
                'key' => $key,
                'slug' => $def['slug'],
                'color' => $def['color'],
                'description' => $def['description'],
                'visibility' => 'workspace',
                'status' => 'active',
            ]);
            $this->projects[$key] = $project;
            $this->counters[$key] = 0;

            foreach ($def['members'] as $email => [$role, $capacity]) {
                $project->members()->create([
                    'user_id' => $this->users[$email]->id,
                    'role' => $role,
                    'added_by' => $rina->id,
                    'capacity_hours' => $capacity,
                ]);
            }

            $board = $project->boards()->create([
                'name' => 'Board',
                'type' => 'kanban',
                'is_default' => true,
            ]);
            $this->boards[$key] = $board;

            $columns = [
                ['name' => 'Backlog', 'status_key' => 'backlog', 'color' => '#6B7280', 'position' => 0],
                ['name' => 'Todo', 'status_key' => 'todo', 'color' => '#475569', 'position' => 1],
                ['name' => 'In Progress', 'status_key' => 'in_progress', 'color' => '#2563EB', 'position' => 2],
                ['name' => 'Review', 'status_key' => 'review', 'color' => '#D97706', 'position' => 3],
                ['name' => 'Done', 'status_key' => 'done', 'color' => '#16A34A', 'position' => 4, 'is_done_column' => true],
            ];
            foreach ($columns as $col) {
                $this->columns[$key][$col['status_key']] = $board->columns()->create($col);
                $this->positions[$key.'/'.$col['status_key']] = 0;
            }

            app(SettingService::class)->bulk($project, [
                'default_board_id' => $board->id,
                'auto_assign_reporter' => false,
            ]);
        }
    }

    protected function seedTaxonomy(): void
    {
        $svra = $this->projects['SVRA'];

        foreach ([
            ['API', 'api', '#2563EB'], ['UI', 'ui', '#8B5CF6'],
            ['Bug', 'bug', '#DC2626'], ['Research', 'research', '#D97706'],
        ] as [$name, $slug, $color]) {
            Label::create([
                'workspace_id' => $this->workspace->id,
                'project_id' => $svra->id,
                'name' => $name, 'slug' => $slug, 'color' => $color,
            ]);
        }

        foreach ([
            ['Billing', 'Charging, invoicing, and dunning.', 'sinta@svara.id'],
            ['Auth', 'Login, sessions, SSO, and API keys.', 'bagas@svara.id'],
            ['Dashboard', 'Customer-facing analytics views.', 'dimas@svara.id'],
        ] as [$name, $desc, $lead]) {
            $svra->components()->create([
                'name' => $name, 'description' => $desc,
                'lead_id' => $this->users[$lead]->id,
            ]);
        }

        $this->epics['checkout'] = Epic::create([
            'project_id' => $svra->id, 'name' => 'Checkout revamp',
            'summary' => 'New pricing-aware checkout with proration, VAT, and analytics.',
            'color' => '#2563EB', 'status' => 'completed',
            'start_date' => now()->subDays(30)->toDateString(),
            'due_date' => now()->subDays(14)->toDateString(),
        ]);
        $this->epics['realtime'] = Epic::create([
            'project_id' => $svra->id, 'name' => 'Realtime notifications',
            'summary' => 'WebSocket delivery, presence, and notification preferences.',
            'color' => '#8B5CF6', 'status' => 'active',
            'start_date' => now()->subDays(6)->toDateString(),
            'due_date' => now()->addDays(8)->toDateString(),
        ]);
        $this->epics['mobile'] = Epic::create([
            'project_id' => $svra->id, 'name' => 'Mobile app (phase 1)',
            'summary' => 'Read-only companion app for approvals on the go.',
            'color' => '#16A34A', 'status' => 'planned',
            'start_date' => now()->addDays(20)->toDateString(),
            'due_date' => now()->addDays(60)->toDateString(),
        ]);
    }

    /** @var array<string, string> */
    protected array $wsRoles = [];

    /** @var array<string, Epic> */
    protected array $epics = [];

    /**
     * Create a task with coherent numbering, column, status, and position.
     *
     * @param  array<string, mixed>  $attrs
     */
    protected function task(string $projectKey, string $column, array $attrs): Task
    {
        $project = $this->projects[$projectKey];
        $board = $this->boards[$projectKey];
        $posKey = $projectKey.'/'.$column;
        $this->positions[$posKey] += 1000;
        $this->counters[$projectKey]++;

        $n = $this->counters[$projectKey];

        $meta = [
            'assignees' => (array) ($attrs['assignees'] ?? []),
            'labels' => (array) ($attrs['labels'] ?? []),
            'watchers' => (array) ($attrs['watchers'] ?? []),
            'epic' => $attrs['epic'] ?? null,
        ];
        unset($attrs['assignees'], $attrs['labels'], $attrs['watchers'], $attrs['epic']);

        $task = Task::create(array_merge([
            'project_id' => $project->id,
            'board_id' => $board->id,
            'board_column_id' => $this->columns[$projectKey][$column]->id,
            'task_type_id' => $this->types['task'],
            'priority_id' => $this->priorities['medium'],
            'reporter_id' => $this->users['rina@svara.id']->id,
            'task_number' => $n,
            'code' => $project->key.'-'.$n,
            'status' => $column,
            'position' => $this->positions[$posKey],
            'created_at' => now()->subDays(20),
        ], $attrs));

        if ($meta['assignees'] !== []) {
            $ids = collect($meta['assignees'])
                ->map(fn ($email) => $this->users[$email]->id)->all();
            $task->assignees()->attach($ids);
        }
        if ($meta['labels'] !== []) {
            $ids = Label::where('project_id', $project->id)
                ->whereIn('slug', $meta['labels'])->pluck('id')->all();
            $task->labels()->attach($ids);
        }
        if ($meta['epic'] !== null) {
            $this->epics[$meta['epic']]->tasks()->attach($task->id);
        }
        if ($meta['watchers'] !== []) {
            $ids = collect($meta['watchers'])
                ->map(fn ($email) => $this->users[$email]->id)->all();
            $task->watchers()->attach($ids);
        }

        return $task;
    }

    /** @var array<string, Sprint> */
    protected array $sprints = [];

    /** @var array<string, Release> */
    protected array $releases = [];

    /** @var array<string, Task> tasks kept for later cross-links, keyed by nickname */
    protected array $keyTasks = [];

    protected function D(int $days): string
    {
        return now()->addDays($days)->toDateString();
    }

    protected function seedSprintsAndTasks(): void
    {
        $svra = $this->projects['SVRA'];

        $this->sprints['s11'] = Sprint::create([
            'project_id' => $svra->id, 'name' => 'Sprint 11',
            'goal' => 'Checkout revamp goes live for all new customers.',
            'status' => 'completed', 'start_date' => $this->D(-28),
            'end_date' => $this->D(-14), 'committed_points' => 36,
            'completed_at' => $this->D(-14),
        ]);
        $this->sprints['s12'] = Sprint::create([
            'project_id' => $svra->id, 'name' => 'Sprint 12',
            'goal' => 'Realtime notifications beta for 10 pilot workspaces.',
            'status' => 'active', 'start_date' => $this->D(-6),
            'end_date' => $this->D(8), 'committed_points' => 35,
        ]);

        $this->releases['v24'] = Release::create([
            'project_id' => $svra->id,
            'created_by' => $this->users['rina@svara.id']->id,
            'name' => 'v2.4 — Checkout revamp',
            'description' => 'Proration, EU VAT validation, discount codes, and checkout analytics.',
            'release_date' => $this->D(-14), 'status' => 'released',
        ]);
        $this->releases['v25'] = Release::create([
            'project_id' => $svra->id,
            'created_by' => $this->users['rina@svara.id']->id,
            'name' => 'v2.5 — Realtime notifications',
            'description' => 'WebSocket delivery, presence indicators, and notification preferences.',
            'release_date' => $this->D(14), 'status' => 'scheduled',
        ]);

        $T = $this->types;
        $P = $this->priorities;

        // ---- Backlog (no sprint attached) ----
        $backlog = [
            ['Refactor billing webhook handler', 'story', 'high', 5, ['sinta@svara.id'], ['api'], null, 'Webhooks occasionally process events out of order under burst traffic. Idempotency keys first, then the handler split.', null, null],
            ['Webhook timeout under load', 'bug', 'urgent', 3, ['sinta@svara.id'], ['bug', 'api'], null, 'P95 crosses 8s during invoice runs. Suspect N+1 in the event serializer.', $this->D(-20), $this->D(3)],
            ['Audit log export to CSV', 'task', 'medium', 3, ['dimas@svara.id'], [], null, 'Compliance request from two enterprise trials. Filter by actor, action, and date range.', null, null],
            ['Dark mode for settings pages', 'story', 'medium', 5, ['maya@svara.id', 'dimas@svara.id'], ['ui'], null, 'Last unthemed surface. Tokens exist; mostly a pass over form components.', null, null],
            ['Upgrade dependencies Q4', 'improvement', 'low', 2, ['bagas@svara.id'], [], null, 'Laravel, Inertia, and the socket server. Staged rollout behind the canary flag.', null, null],
            ['Write incident response runbook', 'task', 'medium', 2, ['fajar@svara.id'], [], null, 'Severity levels, paging rotation, and comms templates in one page.', null, null],
            ['SSO with Google Workspace', 'story', 'high', 8, ['bagas@svara.id'], ['api'], null, 'Most-requested enterprise feature. Start with OIDC, SAML later.', $this->D(-10), $this->D(30)],
            ['Avatar upload fails on Safari', 'bug', 'high', 2, ['dimas@svara.id'], ['bug', 'ui'], null, 'HEIC files rejected client-side before upload. Repro steps attached by support.', $this->D(-4), $this->D(5)],
        ];
        foreach ($backlog as [$title, $type, $prio, $pts, $asg, $labels, $epic, $desc, $start, $due]) {
            $this->task('SVRA', 'backlog', array_filter([
                'title' => $title, 'description' => $desc,
                'task_type_id' => $T[$type], 'priority_id' => $P[$prio],
                'story_points' => $pts, 'assignees' => $asg, 'labels' => $labels,
                'epic' => $epic, 'start_date' => $start, 'due_date' => $due,
                'created_at' => now()->subDays(25),
            ]));
        }

        // ---- Sprint 11 (completed): 9 tasks, 34 pts, all done ----
        $s11 = [
            ['Stripe checkout session expiry', 'bug', 'high', 5, ['sinta@svara.id'], -27, 'Sessions expired silently after 24h; now they refresh with a warning banner.'],
            ['Prorated invoices for plan upgrades', 'story', 'high', 8, ['sinta@svara.id'], -26, 'Mid-cycle upgrades now prorate to the second. Edge cases covered for annual plans.'],
            ['Receipt email template', 'task', 'medium', 3, ['maya@svara.id'], -25, 'New transactional template with PDF receipt attached.'],
            ['Discount codes for annual plans', 'story', 'medium', 5, ['dimas@svara.id'], -24, 'Percentage and fixed codes, per-plan allowlists, usage caps.'],
            ['Fix race condition in seat counter', 'bug', 'urgent', 3, ['sinta@svara.id'], -22, 'Atomic increment via cache lock. Load-tested to 500 concurrent invites.'],
            ['Add EU VAT validation', 'task', 'high', 5, ['dimas@svara.id'], -20, 'VIES lookup with graceful fallback when the service is down.'],
            ['Checkout analytics events', 'task', 'medium', 2, ['fajar@svara.id'], -18, 'Started, completed, and abandoned events with consistent properties.'],
            ['Empty state for billing page', 'improvement', 'low', 2, ['maya@svara.id'], -16, 'Trialing workspaces now see a guided setup checklist.'],
            ['Regression test checkout flow', 'task', 'medium', 3, ['fajar@svara.id'], -15, 'Full pass on staging across cards, invoices, and webhooks. Green.'],
        ];
        foreach ($s11 as [$title, $type, $prio, $pts, $asg, $doneAgo, $desc]) {
            $t = $this->task('SVRA', 'done', [
                'title' => $title, 'description' => $desc,
                'task_type_id' => $T[$type], 'priority_id' => $P[$prio],
                'story_points' => $pts, 'assignees' => $asg,
                'labels' => $type === 'bug' ? ['bug'] : [],
                'epic' => 'checkout',
                'release_id' => $this->releases['v24']->id,
                'start_date' => $this->D($doneAgo - 4), 'due_date' => $this->D($doneAgo + 1),
                'completed_at' => now()->addDays($doneAgo),
                'created_at' => now()->subDays(30),
            ]);
            $this->sprints['s11']->tasks()->attach($t->id);
        }

        // ---- Sprint 12 (active) ----
        $done = function (string $title, string $type, string $prio, int $pts, array $asg, int $doneAgo, string $desc, array $extra = []) {
            $t = $this->task('SVRA', 'done', array_merge([
                'title' => $title, 'description' => $desc,
                'task_type_id' => $this->types[$type], 'priority_id' => $this->priorities[$prio],
                'story_points' => $pts, 'assignees' => $asg,
                'epic' => 'realtime', 'release_id' => $this->releases['v25']->id,
                'start_date' => $this->D(-6), 'due_date' => $this->D(2),
                'completed_at' => now()->addDays($doneAgo),
                'created_at' => now()->subDays(8),
            ], $extra));
            $this->sprints['s12']->tasks()->attach($t->id);

            return $t;
        };
        $live = function (string $col, string $title, string $type, string $prio, int $pts, array $asg, string $desc, array $extra = []) {
            $t = $this->task('SVRA', $col, array_merge([
                'title' => $title, 'description' => $desc,
                'task_type_id' => $this->types[$type], 'priority_id' => $this->priorities[$prio],
                'story_points' => $pts, 'assignees' => $asg,
                'epic' => 'realtime', 'release_id' => $this->releases['v25']->id,
                'start_date' => $this->D(-4), 'due_date' => $this->D(6),
                'created_at' => now()->subDays(8),
            ], $extra));
            $this->sprints['s12']->tasks()->attach($t->id);

            return $t;
        };

        $done('WebSocket gateway scaffolding', 'task', 'high', 5, ['bagas@svara.id'], -2, 'Socket server, auth handshake, and room fan-out landed behind the beta flag.');
        $done('Presence indicator UI', 'story', 'medium', 3, ['maya@svara.id'], -1, 'Green dots on avatars wherever collaborators appear.');

        $this->keyTasks['worker'] = $live('in_progress', 'Push notification worker', 'story', 'high', 8, ['sinta@svara.id'], 'Queue worker that batches pushes per device. Include a polling fallback for flaky networks.', ['labels' => ['api'], 'watchers' => ['rina@svara.id']]);
        $live('in_progress', 'Notification preferences page', 'story', 'medium', 5, ['dimas@svara.id'], 'Per-channel toggles with a live preview pane.', ['labels' => ['ui']]);
        $live('in_progress', 'Overdue invoice reminders', 'task', 'medium', 3, ['rizky@svara.id'], 'Dunning nudges at 3, 7, and 14 days. Copy reviewed by Lina.', ['due_date' => $this->D(-1)]);

        $this->keyTasks['mentions'] = $live('review', 'Sound and badge for mentions', 'task', 'medium', 3, ['dimas@svara.id'], 'Subtle chime plus unread badge. Respects OS do-not-disturb.', ['labels' => ['ui'], 'watchers' => ['rina@svara.id', 'bagas@svara.id']]);
        $live('review', 'Rate-limit socket reconnects', 'bug', 'high', 3, ['bagas@svara.id'], 'Exponential backoff with jitter; kills the reconnect storm seen in staging.', ['labels' => ['bug', 'api']]);

        $this->keyTasks['docs-api'] = $live('todo', 'Docs: notification API', 'task', 'low', 2, ['lina@svara.id'], 'Reference for subscribe, publish, and delivery receipts with curl examples.');
        $this->keyTasks['checklist'] = $live('todo', 'Beta rollout checklist', 'task', 'medium', 3, ['rina@svara.id'], 'Pilot workspace list, flag states, rollback plan, and comms draft.');

        // ---- Non-sprint column tasks ----
        $this->task('SVRA', 'todo', [
            'title' => 'Migrate old avatar storage', 'description' => 'Legacy disk still holds 40k files. Backfill then cut over.',
            'task_type_id' => $T['improvement'], 'priority_id' => $P['low'],
            'story_points' => 2, 'assignees' => ['rizky@svara.id'],
            'created_at' => now()->subDays(12),
        ]);
        $this->task('SVRA', 'in_progress', [
            'title' => 'Harden session refresh flow', 'description' => 'Rotate refresh tokens on every use; revoke families on reuse detection.',
            'task_type_id' => $T['task'], 'priority_id' => $P['high'],
            'story_points' => 5, 'assignees' => ['bagas@svara.id'], 'labels' => ['api'],
            'start_date' => $this->D(-3), 'due_date' => $this->D(4),
            'created_at' => now()->subDays(9),
        ]);
        $this->task('SVRA', 'review', [
            'title' => 'Indonesian i18n pass for emails', 'description' => 'All transactional emails reviewed by a native speaker.',
            'task_type_id' => $T['task'], 'priority_id' => $P['medium'],
            'story_points' => 3, 'assignees' => ['lina@svara.id'],
            'start_date' => $this->D(-2), 'due_date' => $this->D(2),
            'created_at' => now()->subDays(7),
        ]);
        $this->task('SVRA', 'done', [
            'title' => 'Fix PDF export fonts', 'description' => 'Embedded the missing glyph set; invoices render correctly again.',
            'task_type_id' => $T['bug'], 'priority_id' => $P['medium'],
            'story_points' => 2, 'assignees' => ['fajar@svara.id'], 'labels' => ['bug'],
            'release_id' => $this->releases['v24']->id,
            'start_date' => $this->D(-12), 'due_date' => $this->D(-10),
            'completed_at' => now()->subDays(10),
            'created_at' => now()->subDays(16),
        ]);
        $this->task('SVRA', 'todo', [
            'title' => 'Spike: Postgres partitioning', 'description' => 'Two-day timebox. Measure before proposing the migration.',
            'task_type_id' => $T['task'], 'priority_id' => $P['low'],
            'story_points' => 1, 'assignees' => ['sinta@svara.id'],
            'created_at' => now()->subDays(5),
        ]);

        // ---- Dashboard demo rows for Rina (overdue + upcoming) ----
        $this->keyTasks['overdue'] = $this->task('SVRA', 'todo', [
            'title' => 'Approve beta pilot contracts', 'description' => 'Three pilot MSAs waiting on legal redlines.',
            'task_type_id' => $T['task'], 'priority_id' => $P['urgent'],
            'story_points' => 1, 'assignees' => ['rina@svara.id'],
            'due_date' => $this->D(-1), 'created_at' => now()->subDays(6),
        ]);
        $this->task('SVRA', 'todo', [
            'title' => 'Prepare Sprint 12 demo script', 'description' => 'Five-minute flow: trigger event, watch it arrive live.',
            'task_type_id' => $T['task'], 'priority_id' => $P['high'],
            'story_points' => 1, 'assignees' => ['rina@svara.id'],
            'due_date' => $this->D(2), 'created_at' => now()->subDays(3),
        ]);
        $this->task('SVRA', 'todo', [
            'title' => 'Review Q4 hiring plan', 'description' => 'Two backend seats and one designer. Budget draft from finance.',
            'task_type_id' => $T['task'], 'priority_id' => $P['medium'],
            'story_points' => 1, 'assignees' => ['rina@svara.id'],
            'due_date' => $this->D(5), 'created_at' => now()->subDays(2),
        ]);

        // ---- Company Website project (8 tasks, no sprints) ----
        $web = [
            ['backlog', 'New hero section', 'story', 'medium', 3, ['maya@svara.id'], 'Show the dashboard, not the tagline. Screenshot-driven hero.'],
            ['backlog', 'Blog: 5 workflow tips', 'task', 'low', 2, ['lina@svara.id'], 'Repurpose the onboarding email series.'],
            ['backlog', 'Pricing FAQ update', 'task', 'medium', 2, ['lina@svara.id'], 'Answer the proration question once and for all.'],
            ['backlog', 'Compress landing images', 'improvement', 'low', 1, ['dimas@svara.id'], 'AVIF + lazy loading, target < 800KB total.'],
            ['todo', 'Changelog page', 'task', 'medium', 3, ['dimas@svara.id'], 'Pull entries from release notes automatically.'],
            ['todo', 'Status page link in footer', 'task', 'low', 1, ['dimas@svara.id'], 'Uptime provider embed, cached hourly.'],
            ['in_progress', 'Testimonial section', 'story', 'medium', 3, ['maya@svara.id'], 'Two pilot quotes approved, waiting on logos.'],
            ['done', 'Launch blog', 'task', 'medium', 3, ['dimas@svara.id'], 'RSS, sitemap, and OG images all live.'],
        ];
        foreach ($web as [$col, $title, $type, $prio, $pts, $asg, $desc]) {
            $attrs = [
                'title' => $title, 'description' => $desc,
                'task_type_id' => $T[$type], 'priority_id' => $P[$prio],
                'story_points' => $pts, 'assignees' => $asg,
                'created_at' => now()->subDays(15),
            ];
            if ($col === 'done') {
                $attrs['completed_at'] = now()->subDays(9);
            }
            if ($col === 'in_progress') {
                $attrs['start_date'] = $this->D(-2);
                $attrs['due_date'] = $this->D(4);
            }
            $this->task('SVWB', $col, $attrs);
        }
    }

    // PART3

    protected function seedCollaboration(): void
    {
        $rina = $this->users['rina@svara.id'];
        $bagas = $this->users['bagas@svara.id'];
        $sinta = $this->users['sinta@svara.id'];
        $dimas = $this->users['dimas@svara.id'];
        $lina = $this->users['lina@svara.id'];

        $worker = $this->keyTasks['worker'];
        $c = TaskComment::create([
            'task_id' => $worker->id, 'user_id' => $rina->id,
            'body' => '@sinta Please include a polling fallback for flaky networks before we call this done.',
            'created_at' => now()->subDays(3),
        ]);
        TaskComment::create([
            'task_id' => $worker->id, 'user_id' => $sinta->id, 'parent_id' => $c->id,
            'body' => 'Fallback landed behind the same flag. Testing on throttled 3G today.',
            'created_at' => now()->subDay(),
        ]);

        TaskComment::create([
            'task_id' => $this->keyTasks['mentions']->id, 'user_id' => $bagas->id,
            'body' => 'Reviewed the backoff curve — looks good. One nit on the max delay constant.',
            'created_at' => now()->subDay(),
        ]);

        $sso = Task::where('project_id', $this->projects['SVRA']->id)
            ->where('title', 'SSO with Google Workspace')->firstOrFail();
        TaskComment::create([
            'task_id' => $sso->id, 'user_id' => $rina->id,
            'body' => 'Enterprise trials keep asking for this. Scoping OIDC first, SAML next quarter.',
            'created_at' => now()->subDays(6),
        ]);

        $webhook = Task::where('project_id', $this->projects['SVRA']->id)
            ->where('title', 'Webhook timeout under load')->firstOrFail();
        TaskComment::create([
            'task_id' => $webhook->id, 'user_id' => $sinta->id,
            'body' => 'Found it — N+1 in the event serializer. Fix in progress.',
            'created_at' => now()->subDays(2),
        ]);

        TaskComment::create([
            'task_id' => $this->keyTasks['docs-api']->id, 'user_id' => $lina->id,
            'body' => 'Draft ready for tech review. Examples tested against staging.',
            'created_at' => now()->subDay(),
        ]);

        TaskRelation::create([
            'task_id' => $worker->id,
            'related_task_id' => $this->keyTasks['checklist']->id,
            'relation_type' => 'blocks',
        ]);
        $session = Task::where('project_id', $this->projects['SVRA']->id)
            ->where('title', 'Harden session refresh flow')->firstOrFail();
        TaskRelation::create([
            'task_id' => $sso->id, 'related_task_id' => $session->id,
            'relation_type' => 'relates_to',
        ]);
    }

    protected function seedDelivery(): void
    {
        $svra = $this->projects['SVRA'];
        $rina = $this->users['rina@svara.id'];
        $bagas = $this->users['bagas@svara.id'];

        $flow = ApprovalFlow::create([
            'project_id' => $svra->id,
            'column_id' => $this->columns['SVRA']['review']->id,
            'name' => 'Design & code review',
            'required_approvers' => [
                ['type' => 'user', 'value' => $bagas->id],
                ['type' => 'user', 'value' => $rina->id],
            ],
            'min_approvals' => 1,
            'enabled' => true,
        ]);

        TaskApproval::create([
            'task_id' => $this->keyTasks['mentions']->id,
            'approval_flow_id' => $flow->id,
            'approver_id' => $bagas->id,
            'status' => 'approved',
            'comment' => 'Reviewed the reconnect curve — approved.',
        ]);
        TaskApproval::create([
            'task_id' => $this->keyTasks['mentions']->id,
            'approval_flow_id' => $flow->id,
            'approver_id' => $rina->id,
            'status' => 'pending',
        ]);

        $i18n = Task::where('project_id', $svra->id)
            ->where('title', 'Indonesian i18n pass for emails')->firstOrFail();
        TaskApproval::create([
            'task_id' => $i18n->id,
            'approval_flow_id' => $flow->id,
            'approver_id' => $rina->id,
            'status' => 'rejected',
            'comment' => 'Copy needs a second native-speaker pass.',
        ]);
    }

    protected function seedGovernance(): void
    {
        $svra = $this->projects['SVRA'];

        AutomationRule::create([
            'project_id' => $svra->id,
            'name' => 'Label urgent bugs automatically',
            'trigger_event' => 'task.created',
            'conditions' => [['field' => 'priority', 'operator' => 'is', 'value' => 'urgent']],
            'actions' => [['type' => 'add_label', 'label' => 'Bug']],
            'enabled' => true, 'priority' => 0,
        ]);
        AutomationRule::create([
            'project_id' => $svra->id,
            'name' => 'Notify leads when work hits Review',
            'trigger_event' => 'task.status_changed',
            'conditions' => [['field' => 'status', 'operator' => 'is', 'value' => 'review']],
            'actions' => [['type' => 'notify', 'target' => 'project-leads']],
            'enabled' => true, 'priority' => 1,
        ]);
        AutomationRule::create([
            'project_id' => $svra->id,
            'name' => 'Remind assignees after due date',
            'trigger_event' => 'task.due_date_passed',
            'conditions' => [],
            'actions' => [['type' => 'notify', 'target' => 'assignees']],
            'enabled' => true, 'priority' => 2,
        ]);

        SlaPolicy::create([
            'project_id' => $svra->id, 'task_type_id' => $this->types['bug'],
            'response_hours' => 4, 'resolution_hours' => 24, 'enabled' => true,
        ]);
        SlaPolicy::create([
            'project_id' => $svra->id, 'task_type_id' => $this->types['task'],
            'response_hours' => 24, 'resolution_hours' => 72, 'enabled' => true,
        ]);

        SavedFilter::create([
            'project_id' => $svra->id,
            'user_id' => $this->users['rina@svara.id']->id,
            'name' => 'Urgent open bugs',
            'filters' => ['priority' => 'urgent', 'status' => 'todo'],
            'is_shared' => true,
        ]);

        NotificationRule::create([
            'user_id' => $this->users['rina@svara.id']->id,
            'project_id' => $svra->id,
            'name' => 'Assignments for me',
            'event_type' => 'task.assignee_added',
            'conditions' => ['assignee' => 'me'],
            'channels' => ['in_app', 'mail'],
            'enabled' => true,
        ]);
    }

    protected function seedKnowledge(): void
    {
        $svra = $this->projects['SVRA'];
        $rina = $this->users['rina@svara.id'];
        $bagas = $this->users['bagas@svara.id'];
        $lina = $this->users['lina@svara.id'];

        $g1 = Goal::create([
            'workspace_id' => $this->workspace->id,
            'title' => 'Ship Svara 2.5 on schedule',
            'description' => 'Realtime notifications beta for 10 pilot workspaces, no P0 at release.',
            'status' => 'active', 'target_date' => $this->D(14),
        ]);
        $g1->keyResults()->createMany([
            ['title' => 'Sprint 12 story points done', 'target_value' => 32, 'current_value' => 8, 'status' => 'in_progress'],
            ['title' => 'P0 defects fixed', 'target_value' => 6, 'current_value' => 4, 'status' => 'in_progress'],
            ['title' => 'Beta checklist items complete', 'target_value' => 10, 'current_value' => 3, 'status' => 'not_started'],
        ]);
        $g1->epics()->attach($this->epics['realtime']->id);

        $g2 = Goal::create([
            'workspace_id' => $this->workspace->id,
            'title' => 'Answer every support ticket within 4 hours',
            'description' => 'Backed by the help center and the new SLA policies.',
            'status' => 'active', 'target_date' => $this->D(30),
        ]);
        $g2->keyResults()->createMany([
            ['title' => 'Help center articles published', 'target_value' => 8, 'current_value' => 5, 'status' => 'in_progress'],
            ['title' => 'CSAT after support contact', 'target_value' => 90, 'current_value' => 87, 'status' => 'in_progress'],
        ]);

        $apiGuide = Doc::create([
            'project_id' => $svra->id, 'created_by' => $rina->id,
            'title' => 'Notification API guide', 'slug' => 'notification-api-guide',
            'content' => '# Notification API guide'.PHP_EOL.PHP_EOL.'Subscribe, publish, and delivery receipts.'.PHP_EOL.PHP_EOL.'```bash'.PHP_EOL.'curl -H "Authorization: Bearer $KEY" https://api.svara.id/v1/notifications'.PHP_EOL.'```'.PHP_EOL,
        ]);
        DocVersion::create([
            'doc_id' => $apiGuide->id, 'edited_by' => $rina->id,
            'title' => 'Notification API guide',
            'content' => $apiGuide->content ?? '',
        ]);
        Doc::create([
            'project_id' => $svra->id, 'created_by' => $bagas->id,
            'title' => 'On-call runbook', 'slug' => 'on-call-runbook',
            'content' => '# On-call runbook'.PHP_EOL.PHP_EOL.'## Severity levels'.PHP_EOL.PHP_EOL.'- SEV1: billing down, page immediately.'.PHP_EOL.'- SEV2: degraded, respond within 30 minutes.'.PHP_EOL,
        ]);

        $eng = Category::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Engineering', 'color' => '#2563EB',
        ]);
        $help = Category::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Help Center', 'color' => '#16A34A',
        ]);

        Article::create([
            'workspace_id' => $this->workspace->id,
            'author_id' => $bagas->id, 'category_id' => $eng->id,
            'title' => 'How Svara API keys work',
            'content' => 'Keys are scoped per workspace and rotate without downtime. Keep them in a secret manager, never in client bundles.',
            'status' => 'published',
        ]);
        Article::create([
            'workspace_id' => $this->workspace->id,
            'author_id' => $lina->id, 'category_id' => $help->id,
            'title' => 'Reset your workspace password',
            'content' => 'Open Settings, choose Security, then Send reset link. Links expire after 60 minutes.',
            'status' => 'published',
        ]);
        Article::create([
            'workspace_id' => $this->workspace->id,
            'author_id' => $rina->id, 'category_id' => $eng->id,
            'title' => 'Svara 2.5 roadmap',
            'content' => 'Draft — realtime notifications, then SSO.',
            'status' => 'draft',
        ]);
    }

    protected function seedActivity(): void
    {
        $worker = $this->keyTasks['worker'];
        $mentions = $this->keyTasks['mentions'];
        $sinta = $this->users['sinta@svara.id'];
        $dimas = $this->users['dimas@svara.id'];
        $rina = $this->users['rina@svara.id'];

        $rows = [
            [$worker->id, $sinta->id, 'created', null, null, null, -8],
            [$worker->id, $rina->id, 'assigned', 'assignee', null, 'Sinta Maharani', -8],
            [$worker->id, $sinta->id, 'status_changed', 'status', 'todo', 'in_progress', -4],
            [$worker->id, $sinta->id, 'commented', null, null, null, -1],
            [$mentions->id, $dimas->id, 'status_changed', 'status', 'in_progress', 'review', -2],
            [$mentions->id, $rina->id, 'approval_requested', null, null, null, -2],
            [$this->keyTasks['checklist']->id, $rina->id, 'created', null, null, null, -5],
            [$this->keyTasks['docs-api']->id, $rina->id, 'assigned', 'assignee', null, 'Lina Hartono', -4],
            [$this->keyTasks['overdue']->id, $rina->id, 'created', null, null, null, -6],
        ];
        foreach ($rows as [$taskId, $userId, $action, $field, $old, $new, $daysAgo]) {
            TaskActivity::create([
                'task_id' => $taskId, 'user_id' => $userId, 'action' => $action,
                'field_name' => $field, 'old_value' => $old, 'new_value' => $new,
                'created_at' => now()->addDays($daysAgo),
            ]);
        }

        foreach ([
            ['task.assigned', 'You were assigned to Push notification worker.'],
            ['task.mentioned', 'Rina mentioned you in Push notification worker.'],
            ['task.status_changed', 'Sound and badge for mentions moved to Review.'],
            ['sprint.completed', 'Sprint 11 completed with 34 story points.'],
            ['release.scheduled', 'v2.5 — Realtime notifications was scheduled.'],
        ] as [$action, $desc]) {
            ActivityLog::create([
                'workspace_id' => $this->workspace->id,
                'project_id' => $this->projects['SVRA']->id,
                'user_id' => $rina->id,
                'action' => $action, 'description' => $desc,
            ]);
        }
    }
}
