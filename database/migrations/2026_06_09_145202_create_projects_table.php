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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces');
            $table->foreignId('created_by')->constrained('users');
            $table->string('name', 150);
            $table->string('key', 20);
            $table->string('slug', 180);
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->string('color', 30)->nullable();
            $table->string('visibility', 30)->default('private');
            $table->string('status', 30)->default('active');
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['workspace_id', 'key']);
            $table->unique(['workspace_id', 'slug']);
            $table->index('workspace_id');
            $table->index('created_by');
        });

        Schema::create('project_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects');
            $table->foreignId('user_id')->constrained('users');
            $table->string('role', 50)->default('member');
            $table->foreignId('added_by')->nullable()->constrained('users');
            $table->timestamps();

            $table->unique(['project_id', 'user_id']);
            $table->index(['project_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_members');
        Schema::dropIfExists('projects');
    }
};
