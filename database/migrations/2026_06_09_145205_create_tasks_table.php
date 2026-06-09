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
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects');
            $table->foreignId('board_id')->nullable()->constrained('boards');
            $table->foreignId('board_column_id')->nullable()->constrained('board_columns')->nullOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('tasks');
            $table->foreignId('task_type_id')->constrained('task_types');
            $table->foreignId('priority_id')->nullable()->constrained('priorities');
            $table->foreignId('reporter_id')->constrained('users');
            $table->integer('task_number');
            $table->string('code', 50);
            $table->string('title');
            $table->longText('description')->nullable();
            $table->string('status', 50)->default('todo');
            $table->decimal('position', 20, 6)->default(0);
            $table->date('start_date')->nullable();
            $table->date('due_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['project_id', 'task_number']);
            $table->unique(['project_id', 'code']);
            $table->index(['project_id', 'status']);
            $table->index(['project_id', 'board_column_id']);
            $table->index(['project_id', 'priority_id']);
            $table->index(['project_id', 'task_type_id']);
            $table->index('reporter_id');
            $table->index('board_column_id');
            $table->index('parent_id');
            $table->index('status');
            $table->index('due_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
