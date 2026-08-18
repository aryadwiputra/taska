<?php

namespace Database\Factories;

use App\Models\Doc;
use App\Models\DocAttachment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class DocAttachmentFactory extends Factory
{
    protected $model = DocAttachment::class;

    public function definition(): array
    {
        $fileName = $this->faker->word().'.pdf';
        $mimeType = 'application/pdf';

        return [
            'doc_id' => Doc::factory(),
            'uploaded_by' => User::factory(),
            'disk' => 'public',
            'file_name' => $fileName,
            'file_path' => "workspaces/1/projects/1/docs/1/{$fileName}",
            'mime_type' => $mimeType,
            'file_size' => $this->faker->numberBetween(1024, 1024 * 1024 * 10),
        ];
    }

    public function image(): static
    {
        return $this->state(fn (array $attributes) => [
            'file_name' => $this->faker->word().'.jpg',
            'mime_type' => 'image/jpeg',
        ]);
    }

    public function pdf(): static
    {
        return $this->state(fn (array $attributes) => [
            'file_name' => $this->faker->word().'.pdf',
            'mime_type' => 'application/pdf',
        ]);
    }

    public function excel(): static
    {
        return $this->state(fn (array $attributes) => [
            'file_name' => $this->faker->word().'.xlsx',
            'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function word(): static
    {
        return $this->state(fn (array $attributes) => [
            'file_name' => $this->faker->word().'.docx',
            'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]);
    }
}
