<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->words(3, true);

        return [
            'workspace_id' => Workspace::factory(),
            'created_by' => User::factory(),
            'name' => Str::title($name),
            'key' => Str::upper(Str::random(5)),
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(6)),
            'description' => fake()->sentence(),
            'color' => '#2563EB',
            'visibility' => 'private',
            'status' => 'active',
        ];
    }
}
