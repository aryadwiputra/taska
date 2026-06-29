<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            TciPersonnelSeeder::class,
            TciProjectSeeder::class,
            TciTaskSeeder::class,
        ]);
    }
}
