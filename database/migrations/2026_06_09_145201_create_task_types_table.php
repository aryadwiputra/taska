<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('task_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces');
            $table->string('name', 100);
            $table->string('key', 50);
            $table->string('icon', 100)->nullable();
            $table->string('color', 30)->nullable();
            $table->timestamps();

            $table->unique(['workspace_id', 'key']);
        });

        Schema::create('priorities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces');
            $table->string('name', 100);
            $table->string('key', 50);
            $table->integer('level');
            $table->string('color', 30)->nullable();
            $table->timestamps();

            $table->index('workspace_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('priorities');
        Schema::dropIfExists('task_types');
    }
};
