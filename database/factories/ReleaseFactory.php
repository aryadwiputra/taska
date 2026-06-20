<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\Release;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Release>
 */
class ReleaseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'created_by' => User::factory(),
            'name' => fake()->words(3, true),
            'description' => fake()->optional()->sentence(),
            'release_date' => fake()->dateTimeBetween('now', '+3 months'),
            'status' => fake()->randomElement(['draft', 'scheduled', 'released']),
        ];
    }

    public function draft(): static
    {
        return $this->state(fn () => ['status' => 'draft']);
    }

    public function scheduled(): static
    {
        return $this->state(fn () => ['status' => 'scheduled']);
    }

    public function released(): static
    {
        return $this->state(fn () => ['status' => 'released', 'release_date' => now()]);
    }
}
