<?php

namespace Database\Factories;

use App\Models\Board;
use App\Models\BoardColumn;
use App\Models\Priority;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $project = Project::factory()->create();
        $board = Board::factory()->for($project)->create();
        $column = BoardColumn::factory()->for($board)->create();
        $taskNumber = $project->tasks()->withTrashed()->max('task_number') + 1;

        return [
            'project_id' => $project->id,
            'board_id' => $board->id,
            'board_column_id' => $column->id,
            'task_type_id' => TaskType::factory()->for($project->workspace)->create()->id,
            'priority_id' => Priority::factory()->for($project->workspace)->create()->id,
            'reporter_id' => User::factory(),
            'task_number' => $taskNumber,
            'code' => $project->key.'-'.$taskNumber,
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'status' => $column->status_key,
            'position' => 0,
        ];
    }
}
