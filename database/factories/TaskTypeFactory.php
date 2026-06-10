<?php

namespace Database\Factories;

use App\Models\TaskType;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<TaskType>
 */
class TaskTypeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->randomElement(['Task', 'Bug', 'Story', 'Improvement']).' '.Str::random(4);

        return [
            'workspace_id' => Workspace::factory(),
            'name' => $name,
            'key' => Str::slug($name),
            'icon' => 'check-square',
            'color' => '#64748B',
        ];
    }
}
