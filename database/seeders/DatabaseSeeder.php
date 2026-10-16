<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Workspace;
use App\Services\SettingService;
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
            'name' => 'Pribadi',
            'slug' => 'pribadi',
            'description' => 'Workspace pribadi Arya.',
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

        $projects = [
            [
                'key' => 'HATTI',
                'slug' => 'hatti',
                'name' => 'Hatti',
                'color' => '#2563EB',
                'description' => 'Website company profile Hatti.',
            ],
            [
                'key' => 'KMVG',
                'slug' => 'komodo-voyage',
                'name' => 'Komodo Voyage',
                'color' => '#0891B2',
                'description' => 'Platform online travel agency (OTA) Komodo Voyage.',
            ],
            [
                'key' => 'TIBS',
                'slug' => 'taruna-insani',
                'name' => 'Taruna Insani Boarding School',
                'color' => '#16A34A',
                'description' => 'Sistem informasi sekolah & PPDB Taruna Insani Boarding School.',
            ],
        ];

        $createdBy = $createdUsers[0]['user'];

        foreach ($projects as $pd) {
            $project = $workspace->projects()->create([
                'created_by' => $createdBy->id,
                'name' => $pd['name'],
                'key' => $pd['key'],
                'slug' => $pd['slug'],
                'color' => $pd['color'],
                'description' => $pd['description'],
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

            app(SettingService::class)->bulk($project, [
                'default_board_id' => $board->id,
                'auto_assign_reporter' => false,
            ]);
        }

        $this->call(DocTemplateSeeder::class);
    }
}
