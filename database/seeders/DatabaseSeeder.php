<?php

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\User;
use App\Models\Workspace;
use App\Services\WorkspaceRoleService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $teammate = User::factory()->create([
            'name' => 'Qeerja Teammate',
            'email' => 'teammate@example.com',
        ]);

        $roleService = app(WorkspaceRoleService::class);

        $workspace = Workspace::create([
            'owner_id' => $user->id,
            'name' => 'My Workspace',
            'slug' => 'my-workspace',
        ]);

        $roleService->ensureRoles($workspace);

        $workspace->members()->create([
            'user_id' => $user->id,
            'role' => 'owner',
            'status' => 'active',
        ]);

        $workspace->members()->create([
            'user_id' => $teammate->id,
            'role' => 'member',
            'status' => 'active',
        ]);

        $roleService->syncRole($user, $workspace, 'owner');
        $roleService->syncRole($teammate, $workspace, 'member');

        $this->call(TaskTypeAndPrioritySeeder::class);

        $project = $workspace->projects()->create([
            'created_by' => $user->id,
            'name' => 'Project Alpha',
            'key' => 'ALPHA',
            'slug' => 'project-alpha',
            'description' => 'Sample product roadmap project.',
            'color' => '#2563EB',
            'visibility' => 'private',
            'status' => 'active',
        ]);

        $project->members()->createMany([
            ['user_id' => $user->id, 'role' => 'lead'],
            ['user_id' => $teammate->id, 'role' => 'developer', 'added_by' => $user->id],
        ]);

        $board = $project->boards()->create([
            'name' => 'Board',
            'type' => 'kanban',
            'is_default' => true,
        ]);

        $columns = collect([
            ['name' => 'Backlog', 'status_key' => 'backlog', 'color' => '#6B7280', 'position' => 0],
            ['name' => 'Todo', 'status_key' => 'todo', 'color' => '#475569', 'position' => 1],
            ['name' => 'In Progress', 'status_key' => 'in_progress', 'color' => '#2563EB', 'position' => 2],
            ['name' => 'Review', 'status_key' => 'review', 'color' => '#D97706', 'position' => 3],
            ['name' => 'Done', 'status_key' => 'done', 'color' => '#16A34A', 'position' => 4, 'is_done_column' => true],
        ])->map(fn (array $column) => $board->columns()->create($column));

        $workspace->settings()->createMany([
            ['key' => 'default_locale', 'value' => json_encode(['value' => 'en'])],
            ['key' => 'default_timezone', 'value' => json_encode(['value' => 'Asia/Jakarta'])],
            ['key' => 'auto_watch_own_tasks', 'value' => json_encode(['value' => true])],
        ]);

        $project->settings()->createMany([
            ['key' => 'default_board_id', 'value' => json_encode(['value' => $board->id])],
            ['key' => 'auto_assign_reporter', 'value' => json_encode(['value' => false])],
        ]);

        $taskType = $workspace->taskTypes()->where('key', 'task')->first();
        $bugType = $workspace->taskTypes()->where('key', 'bug')->first();
        $priority = $workspace->priorities()->where('key', 'high')->first();
        $mediumPriority = $workspace->priorities()->where('key', 'medium')->first();

        $tasks = collect([
            ['title' => 'Design landing page', 'column' => 1, 'type' => $taskType, 'priority' => $priority, 'due_date' => now()->addDays(3)],
            ['title' => 'Set up CI pipeline', 'column' => 2, 'type' => $taskType, 'priority' => $mediumPriority, 'due_date' => now()->addDay()],
            ['title' => 'Fix login bug', 'column' => 3, 'type' => $bugType, 'priority' => $priority, 'due_date' => now()->subDay()],
            ['title' => 'Document workspace roles', 'column' => 0, 'type' => $taskType, 'priority' => $mediumPriority, 'due_date' => null],
        ])->map(function (array $sample, int $index) use ($project, $board, $columns, $user, $teammate) {
            $taskNumber = $index + 1;
            $column = $columns[$sample['column']];
            $task = $project->tasks()->create([
                'board_id' => $board->id,
                'board_column_id' => $column->id,
                'task_type_id' => $sample['type']->id,
                'priority_id' => $sample['priority']->id,
                'reporter_id' => $user->id,
                'task_number' => $taskNumber,
                'code' => $project->key.'-'.$taskNumber,
                'title' => $sample['title'],
                'description' => 'Seeded sample task for local development.',
                'status' => $column->status_key,
                'position' => $index,
                'due_date' => $sample['due_date'],
            ]);

            $task->assignees()->attach($index % 2 === 0 ? $user->id : $teammate->id);
            $task->comments()->create([
                'user_id' => $index % 2 === 0 ? $teammate->id : $user->id,
                'body' => 'Sample discussion on '.$sample['title'].'.',
            ]);

            return $task;
        });

        Notification::insert([
            [
                'id' => Str::uuid(),
                'user_id' => $user->id,
                'type' => 'task_assigned',
                'title' => 'Task assigned to you',
                'body' => 'You have been assigned to "Design landing page" in Project Alpha.',
                'data' => json_encode(['task_id' => $tasks[0]->id, 'project_id' => $project->id]),
                'read_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => Str::uuid(),
                'user_id' => $user->id,
                'type' => 'comment_added',
                'title' => 'New comment on your task',
                'body' => 'John commented: "Looks great, let\'s ship it!"',
                'data' => null,
                'read_at' => null,
                'created_at' => now()->subHours(3),
                'updated_at' => now()->subHours(3),
            ],
            [
                'id' => Str::uuid(),
                'user_id' => $user->id,
                'type' => 'member_added',
                'title' => 'Added to workspace',
                'body' => 'You have been added to "Engineering" workspace as a member.',
                'data' => null,
                'read_at' => null,
                'created_at' => now()->subDay(),
                'updated_at' => now()->subDay(),
            ],
            [
                'id' => Str::uuid(),
                'user_id' => $user->id,
                'type' => 'due_date_reminder',
                'title' => 'Task due soon',
                'body' => '"Set up CI pipeline" is due tomorrow.',
                'data' => json_encode(['task_id' => $tasks[1]->id, 'project_id' => $project->id]),
                'read_at' => now()->subDay(),
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(2),
            ],
            [
                'id' => Str::uuid(),
                'user_id' => $user->id,
                'type' => 'task_updated',
                'title' => 'Task status changed',
                'body' => '"Fix login bug" moved from In Progress to Review.',
                'data' => json_encode(['task_id' => $tasks[2]->id, 'project_id' => $project->id]),
                'read_at' => now()->subDays(2),
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(5),
            ],
        ]);
    }
}
