<?php

namespace Database\Factories;

use App\Models\AutomationRule;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AutomationRule>
 */
class AutomationRuleFactory extends Factory
{
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'name' => fake()->words(3, true),
            'enabled' => true,
            'trigger_event' => 'task.status_changed',
            'conditions' => [
                ['field' => 'status', 'operator' => 'equals', 'value' => 'done'],
            ],
            'actions' => [
                ['type' => 'add_label', 'value' => '1'],
            ],
            'priority' => 1,
        ];
    }
}
