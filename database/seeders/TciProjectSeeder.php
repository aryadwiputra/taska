<?php

namespace Database\Seeders;

use App\Models\Workspace;
use Illuminate\Database\Seeder;

class TciProjectSeeder extends Seeder
{
    public function run(): void
    {
        $workspace = Workspace::where('slug', 'tci')->firstOrFail();

        $projectRoleMap = collect([
            'al-baihaqi@tci.co.id' => 'manager',
            'arya@tci.co.id' => 'lead',
            'wanda@tci.co.id' => 'qa',
            'faizal@tci.co.id' => 'qa',
            'fatur@tci.co.id' => 'developer',
            'galih@tci.co.id' => 'developer',
            'raihan@tci.co.id' => 'developer',
            'restu@tci.co.id' => 'viewer',
            'samsu@tci.co.id' => 'viewer',
            'candra@tci.co.id' => 'viewer',
            'yoan@tci.co.id' => 'viewer',
        ]);

        $projects = [
            [
                'key' => 'DTKL',
                'slug' => 'datakelola',
                'name' => 'Datakelola',
                'color' => '#2563EB',
                'description' => 'Platform pengelolaan data terpusat — Laravel + MySQL + TailwindCSS.',
            ],
            [
                'key' => 'DTBC',
                'slug' => 'datakelola-beacukai',
                'name' => 'Datakelola Beacukai',
                'color' => '#7C3AED',
                'description' => 'Modul kepabeanan dan cukai — Laravel + PostgreSQL + TailwindCSS.',
            ],
            [
                'key' => 'DTPL',
                'slug' => 'datakelola-pelni',
                'name' => 'Datakelola Pelni',
                'color' => '#059669',
                'description' => 'Modul pelayaran nasional — Laravel + PostgreSQL + TailwindCSS.',
            ],
            [
                'key' => 'DTAH',
                'slug' => 'datakelola-ahu',
                'name' => 'Datakelola AHU',
                'color' => '#EA580C',
                'description' => 'Modul administrasi hukum umum — Laravel + MySQL + TailwindCSS.',
            ],
            [
                'key' => 'WACT',
                'slug' => 'whatsapp-centralized',
                'name' => 'WhatsApp Centralized',
                'color' => '#16A34A',
                'description' => 'WhatsApp gateway multi-agent — Laravel + MySQL + TailwindCSS.',
            ],
        ];

        $createdBy = $workspace->members()->where('role', 'admin')->firstOrFail()->user;

        foreach ($projects as $projectData) {
            $project = $workspace->projects()->create([
                'created_by' => $createdBy->id,
                'name' => $projectData['name'],
                'key' => $projectData['key'],
                'slug' => $projectData['slug'],
                'description' => $projectData['description'],
                'color' => $projectData['color'],
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

            $projectRoleMap->each(function (string $role, string $email) use ($project) {
                $member = $project->workspace->members()->whereHas('user', fn ($q) => $q->where('email', $email))->first();
                if ($member) {
                    $project->members()->create([
                        'user_id' => $member->user_id,
                        'role' => $role,
                        'added_by' => $project->created_by,
                    ]);
                }
            });

            $project->settings()->createMany([
                ['key' => 'default_board_id', 'value' => json_encode(['value' => $board->id])],
                ['key' => 'auto_assign_reporter', 'value' => json_encode(['value' => false])],
            ]);
        }
    }
}
