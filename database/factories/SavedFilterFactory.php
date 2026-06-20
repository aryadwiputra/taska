<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\SavedFilter;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SavedFilter>
 */
class SavedFilterFactory extends Factory
{
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'user_id' => User::factory(),
            'name' => fake()->words(3, true),
            'filters' => [
                'status' => 'todo',
                'priority_id' => null,
            ],
            'sort_field' => 'position',
            'sort_direction' => 'asc',
            'is_shared' => false,
        ];
    }

    public function shared(): static
    {
        return $this->state(fn () => ['is_shared' => true]);
    }
}
