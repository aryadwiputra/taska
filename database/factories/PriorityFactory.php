<?php

namespace Database\Factories;

use App\Models\Priority;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Priority>
 */
class PriorityFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->randomElement(['Low', 'Medium', 'High']).' '.Str::random(4);

        return [
            'workspace_id' => Workspace::factory(),
            'name' => $name,
            'key' => Str::slug($name),
            'level' => fake()->numberBetween(1, 6),
            'color' => '#D97706',
        ];
    }
}
