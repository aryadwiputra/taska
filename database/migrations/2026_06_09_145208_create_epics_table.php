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
        Schema::create('epics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects');
            $table->string('name', 150);
            $table->text('summary')->nullable();
            $table->string('color', 30)->nullable();
            $table->date('start_date')->nullable();
            $table->date('due_date')->nullable();
            $table->string('status', 30)->default('active');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('epic_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('epic_id')->constrained('epics')->cascadeOnDelete();
            $table->foreignId('task_id')->constrained('tasks');
            $table->timestamp('created_at')->nullable();

            $table->unique(['epic_id', 'task_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('epic_tasks');
        Schema::dropIfExists('epics');
    }
};
