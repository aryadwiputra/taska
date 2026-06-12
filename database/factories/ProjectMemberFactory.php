<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProjectMember>
 */
class ProjectMemberFactory extends Factory
{
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'user_id' => User::factory(),
            'role' => 'member',
            'added_by' => null,
        ];
    }

    public function lead(): static
    {
        return $this->state(fn () => ['role' => 'lead']);
    }

    public function manager(): static
    {
        return $this->state(fn () => ['role' => 'manager']);
    }

    public function viewer(): static
    {
        return $this->state(fn () => ['role' => 'viewer']);
    }
}
