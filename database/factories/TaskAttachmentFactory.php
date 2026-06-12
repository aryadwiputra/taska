<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\TaskAttachment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TaskAttachment>
 */
class TaskAttachmentFactory extends Factory
{
    public function definition(): array
    {
        $ext = fake()->fileExtension();

        return [
            'task_id' => Task::factory(),
            'uploaded_by' => User::factory(),
            'disk' => 'public',
            'file_name' => fake()->word().'.'.$ext,
            'file_path' => 'attachments/'.fake()->uuid().'.'.$ext,
            'mime_type' => fake()->mimeType(),
            'file_size' => fake()->numberBetween(1024, 10485760),
        ];
    }
}
