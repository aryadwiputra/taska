<?php

namespace Database\Factories;

use App\Models\Label;
use App\Models\Project;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Label>
 */
class LabelFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->word();

        return [
            'workspace_id' => Workspace::factory(),
            'project_id' => Project::factory(),
            'name' => Str::title($name),
            'slug' => Str::slug($name),
            'color' => fake()->hexColor(),
        ];
    }
}
