<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('knowledge_articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->nullable()->constrained('knowledge_categories')->nullOnDelete();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('author_id')->constrained('users');
            $table->string('title');
            $table->string('slug');
            $table->longText('content')->nullable();
            $table->unsignedBigInteger('views')->default(0);
            $table->string('status', 20)->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->unique(['workspace_id', 'slug']);
            $table->index(['workspace_id', 'status', 'published_at']);
            $table->index('category_id');
            $table->index('author_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('knowledge_articles');
    }
};
