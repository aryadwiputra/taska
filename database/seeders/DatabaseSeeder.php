<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Workspace;
use App\Services\WorkspaceRoleService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $roleService = app(WorkspaceRoleService::class);

        $users = [
            ['name' => 'Super Admin', 'email' => 'superadmin@taska.web.id', 'superadmin' => true, 'ws_role' => 'owner', 'project_role' => 'lead'],
        ];

        $createdUsers = [];
        foreach ($users as $u) {
            $user = User::factory()->when($u['superadmin'], fn ($f) => $f->asSuperAdmin())->create([
                'name' => $u['name'],
                'email' => $u['email'],
                'password' => Hash::make('Root123!arya'),
            ]);
            $createdUsers[] = ['user' => $user, 'data' => $u];
        }

        $workspace = Workspace::create([
            'owner_id' => $createdUsers[0]['user']->id,
            'name' => 'Datakelola',
            'slug' => 'datakelola',
            'description' => 'Platform pengelolaan project Datakelola.',
        ]);

        $roleService->ensureRoles($workspace);

        foreach ($createdUsers as $cu) {
            $u = $cu['user'];
            $data = $cu['data'];
            $workspace->members()->create([
                'user_id' => $u->id,
                'role' => $data['ws_role'],
                'status' => 'active',
            ]);
            $roleService->syncRole($u, $workspace, $data['ws_role']);
        }

        app()->call(TaskTypeAndPrioritySeeder::class);

        $projects = [
            ['key' => 'DTKL', 'slug' => 'datakelola', 'name' => 'Datakelola', 'color' => '#2563EB'],
            ['key' => 'DTAH', 'slug' => 'datakelola-ahu', 'name' => 'Datakelola AHU', 'color' => '#EA580C'],
            ['key' => 'BCK', 'slug' => 'beacukai', 'name' => 'Beacukai', 'color' => '#7C3AED'],
            ['key' => 'PLN', 'slug' => 'pelni', 'name' => 'Pelni', 'color' => '#059669'],
            ['key' => 'CRM', 'slug' => 'crm', 'name' => 'CRM', 'color' => '#0891B2'],
            ['key' => 'SPC', 'slug' => 'space', 'name' => 'Space', 'color' => '#D946EF'],
            ['key' => 'WAC', 'slug' => 'whatsapp-centralized', 'name' => 'WhatsApp Centralized', 'color' => '#16A34A'],
        ];

        $createdBy = $createdUsers[0]['user'];

        foreach ($projects as $pd) {
            $project = $workspace->projects()->create([
                'created_by' => $createdBy->id,
                'name' => $pd['name'],
                'key' => $pd['key'],
                'slug' => $pd['slug'],
                'color' => $pd['color'],
                'description' => "Project {$pd['name']}.",
                'visibility' => 'workspace',
                'status' => 'active',
            ]);

            $board = $project->boards()->create([
                'name' => 'Board',
                'type' => 'kanban',
                'is_default' => true,
            ]);

            $columns = [
                ['name' => 'Backlog', 'status_key' => 'backlog', 'color' => '#6B7280', 'position' => 0],
                ['name' => 'Todo', 'status_key' => 'todo', 'color' => '#475569', 'position' => 1],
                ['name' => 'In Progress', 'status_key' => 'in_progress', 'color' => '#2563EB', 'position' => 2],
                ['name' => 'Review', 'status_key' => 'review', 'color' => '#D97706', 'position' => 3],
                ['name' => 'Done', 'status_key' => 'done', 'color' => '#16A34A', 'position' => 4, 'is_done_column' => true],
            ];

            foreach ($columns as $col) {
                $board->columns()->create($col);
            }

            foreach ($createdUsers as $cu) {
                $u = $cu['user'];
                $data = $cu['data'];
                $project->members()->create([
                    'user_id' => $u->id,
                    'role' => $data['project_role'],
                    'added_by' => $project->created_by,
                ]);
            }

            $project->settings()->createMany([
                ['key' => 'default_board_id', 'value' => json_encode(['value' => $board->id])],
                ['key' => 'auto_assign_reporter', 'value' => json_encode(['value' => false])],
            ]);
        }

        $this->call(DocTemplateSeeder::class);
    }
}
