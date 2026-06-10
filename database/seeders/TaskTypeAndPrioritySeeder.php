<?php

namespace Database\Seeders;

use App\Models\Workspace;
use Illuminate\Database\Seeder;

class TaskTypeAndPrioritySeeder extends Seeder
{
    public function run(): void
    {
        $taskTypes = [
            ['name' => 'Epic', 'key' => 'epic', 'icon' => 'layers', 'color' => '#6C47FF'],
            ['name' => 'Story', 'key' => 'story', 'icon' => 'book-open', 'color' => '#2563EB'],
            ['name' => 'Task', 'key' => 'task', 'icon' => 'check-square', 'color' => '#64748B'],
            ['name' => 'Bug', 'key' => 'bug', 'icon' => 'bug', 'color' => '#DC2626'],
            ['name' => 'Improvement', 'key' => 'improvement', 'icon' => 'sparkles', 'color' => '#16A34A'],
        ];

        $priorities = [
            ['name' => 'Lowest', 'key' => 'lowest', 'level' => 1, 'color' => '#9CA3AF'],
            ['name' => 'Low', 'key' => 'low', 'level' => 2, 'color' => '#3B82F6'],
            ['name' => 'Medium', 'key' => 'medium', 'level' => 3, 'color' => '#D97706'],
            ['name' => 'High', 'key' => 'high', 'level' => 4, 'color' => '#EA580C'],
            ['name' => 'Highest', 'key' => 'highest', 'level' => 5, 'color' => '#DC2626'],
            ['name' => 'Urgent', 'key' => 'urgent', 'level' => 6, 'color' => '#991B1B'],
        ];

        foreach (Workspace::all() as $workspace) {
            foreach ($taskTypes as $type) {
                $workspace->taskTypes()->firstOrCreate(
                    ['key' => $type['key']],
                    $type,
                );
            }

            foreach ($priorities as $priority) {
                $workspace->priorities()->firstOrCreate(
                    ['key' => $priority['key']],
                    $priority,
                );
            }
        }
    }
}
