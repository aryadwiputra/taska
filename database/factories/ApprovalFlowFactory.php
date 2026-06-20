<?php

namespace Database\Factories;

use App\Models\ApprovalFlow;
use App\Models\BoardColumn;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ApprovalFlow>
 */
class ApprovalFlowFactory extends Factory
{
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'name' => fake()->words(3, true),
            'column_id' => BoardColumn::factory(),
            'required_approvers' => [
                ['type' => 'user', 'value' => 'user:1'],
            ],
            'min_approvals' => 1,
            'enabled' => true,
        ];
    }
}
