<?php

namespace Database\Factories;

use App\Models\Doc;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class DocFactory extends Factory
{
    protected $model = Doc::class;

    public function definition(): array
    {
        $title = $this->faker->sentence(3);

        return [
            'project_id' => Project::factory(),
            'parent_id' => null,
            'created_by' => User::factory(),
            'title' => $title,
            'slug' => Str::slug($title).'-'.$this->faker->unique()->randomNumber(5),
            'content' => $this->faker->paragraphs(3, true),
            'sort_order' => $this->faker->numberBetween(0, 100),
        ];
    }
}
