<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Workspace;
use App\Services\WorkspaceRoleService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TciPersonnelSeeder extends Seeder
{
    public function run(): void
    {
        $roleService = app(WorkspaceRoleService::class);

        $personnel = [
            ['name' => 'Restu Ramadhika', 'email' => 'restu@tci.co.id', 'workspace_role' => 'admin', 'project_role' => 'viewer'],
            ['name' => 'Samsu Rizal', 'email' => 'samsu@tci.co.id', 'workspace_role' => 'admin', 'project_role' => 'viewer'],
            ['name' => 'Candra Nurmansyah', 'email' => 'candra@tci.co.id', 'workspace_role' => 'admin', 'project_role' => 'viewer'],
            ['name' => 'Yoan T', 'email' => 'yoan@tci.co.id', 'workspace_role' => 'admin', 'project_role' => 'viewer'],
            ['name' => 'Wanda', 'email' => 'wanda@tci.co.id', 'workspace_role' => 'member', 'project_role' => 'qa'],
            ['name' => 'M. Faizal', 'email' => 'faizal@tci.co.id', 'workspace_role' => 'member', 'project_role' => 'qa'],
            ['name' => 'Al Baihaqi', 'email' => 'baihaqi@tci.co.id', 'workspace_role' => 'manager', 'project_role' => 'manager'],
            ['name' => 'Arya Dwi Putra', 'email' => 'arya@tci.co.id', 'workspace_role' => 'manager', 'project_role' => 'lead'],
            ['name' => 'Fatur R', 'email' => 'fatur@tci.co.id', 'workspace_role' => 'member', 'project_role' => 'developer'],
            ['name' => 'Galih Adiya', 'email' => 'galih@tci.co.id', 'workspace_role' => 'member', 'project_role' => 'developer'],
            ['name' => 'Raihan Alif', 'email' => 'raihan@tci.co.id', 'workspace_role' => 'member', 'project_role' => 'developer'],
        ];

        $users = collect($personnel)->map(function (array $p) {
            return User::factory()->create([
                'name' => $p['name'],
                'email' => $p['email'],
                'password' => Hash::make('password'),
            ]);
        });

        $workspace = Workspace::create([
            'owner_id' => $users[0]->id,
            'name' => 'PT Tri Cipta Integra',
            'slug' => 'tci',
            'description' => 'Perusahaan teknologi informasi yang bergerak di bidang pengelolaan data, kepabeanan, pelayaran, dan komunikasi.',
        ]);

        $roleService->ensureRoles($workspace);

        foreach ($personnel as $index => $p) {
            $user = $users[$index];

            $workspace->members()->create([
                'user_id' => $user->id,
                'role' => $p['workspace_role'],
                'status' => 'active',
            ]);

            $roleService->syncRole($user, $workspace, $p['workspace_role']);
        }

        // Seed task types & priorities for this workspace
        app()->call(TaskTypeAndPrioritySeeder::class);
    }
}
