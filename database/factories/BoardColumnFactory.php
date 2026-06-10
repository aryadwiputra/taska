<?php

namespace Database\Factories;

use App\Models\Board;
use App\Models\BoardColumn;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BoardColumn>
 */
class BoardColumnFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'board_id' => Board::factory(),
            'name' => 'Todo',
            'status_key' => 'todo',
            'color' => '#475569',
            'position' => 0,
            'is_done_column' => false,
        ];
    }
}
