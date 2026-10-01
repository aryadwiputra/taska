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
        Schema::create('task_assignees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks');
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('assigned_by')->nullable()->constrained('users');
            $table->timestamp('created_at')->nullable();

            $table->unique(['task_id', 'user_id']);
            $table->index('user_id');
        });

        Schema::create('labels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces');
            $table->foreignId('project_id')->nullable()->constrained('projects');
            $table->string('name', 100);
            $table->string('slug', 120);
            $table->string('color', 30)->nullable();
            $table->timestamps();

            $table->unique(['workspace_id', 'project_id', 'slug']);
        });

        Schema::create('task_labels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks');
            $table->foreignId('label_id')->constrained('labels');
            $table->timestamp('created_at')->nullable();

            $table->unique(['task_id', 'label_id']);
        });

        Schema::create('task_watchers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks');
            $table->foreignId('user_id')->constrained('users');
            $table->timestamp('created_at')->nullable();

            $table->unique(['task_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_watchers');
        Schema::dropIfExists('task_labels');
        Schema::dropIfExists('labels');
        Schema::dropIfExists('task_assignees');
    }
};
