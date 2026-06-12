<?php

namespace Database\Factories;

use App\Models\Epic;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Epic>
 */
class EpicFactory extends Factory
{
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'name' => fake()->words(3, true),
            'summary' => fake()->sentence(),
            'color' => fake()->hexColor(),
            'start_date' => fake()->optional()->date(),
            'due_date' => fake()->optional()->date(),
            'status' => 'active',
        ];
    }

    public function planned(): static
    {
        return $this->state(fn () => ['status' => 'planned']);
    }

    public function completed(): static
    {
        return $this->state(fn () => ['status' => 'completed']);
    }

    public function archived(): static
    {
        return $this->state(fn () => ['status' => 'archived']);
    }
}
