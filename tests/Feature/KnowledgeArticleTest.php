<?php

use App\Models\Knowledge\Article;
use App\Models\Knowledge\Category;
use App\Models\User;

test('knowledge page renders with published articles', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');

    $category = Category::create([
        'workspace_id' => $workspace->id,
        'name' => 'Getting Started',
    ]);

    Article::create([
        'workspace_id' => $workspace->id,
        'author_id' => $user->id,
        'category_id' => $category->id,
        'title' => 'Welcome',
        'content' => '<p>Hello</p>',
        'status' => 'published',
    ]);

    Article::create([
        'workspace_id' => $workspace->id,
        'author_id' => $user->id,
        'title' => 'Hidden draft',
        'status' => 'draft',
    ]);

    $this->actingAs($user)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('knowledge.index', $workspace))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('knowledge/index')
            ->has('categories', 1)
            ->where('categories.0.articles_count', 1)
            ->has('recentArticles', 1)
            ->where('recentArticles.0.title', 'Welcome')
        );
});

test('published articles get an auto slug and published_at timestamp', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');

    $article = Article::create([
        'workspace_id' => $workspace->id,
        'author_id' => $user->id,
        'title' => 'Release Notes Q4',
        'status' => 'published',
    ]);

    expect($article->slug)->toBe('release-notes-q4')
        ->and($article->published_at)->not->toBeNull();
});

test('articles can be created and listed through the api', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');

    $this->actingAs($user)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->postJson(route('knowledge.articles.store', $workspace), [
            'title' => 'Installation Guide',
            'content' => '<p>Steps</p>',
            'status' => 'published',
        ])
        ->assertCreated()
        ->assertJsonPath('article.title', 'Installation Guide');

    $this->actingAs($user)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->getJson(route('knowledge.articles.index', $workspace))
        ->assertOk()
        ->assertJsonPath('data.0.title', 'Installation Guide');
});

test('article show page increments views and loads attachments', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');

    $article = Article::create([
        'workspace_id' => $workspace->id,
        'author_id' => $user->id,
        'title' => 'FAQ',
        'status' => 'published',
    ]);

    $this->actingAs($user)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->get(route('knowledge.article', [$workspace, $article]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('knowledge/articles/show')
            ->where('article.title', 'FAQ')
            ->has('article.attachments', 0)
        );

    expect($article->fresh()->views)->toBe(1);
});

test('article is resolved through the workspace scope in the api', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');
    $otherWorkspace = createWorkspaceMember(User::factory()->create(), 'owner');

    $article = Article::create([
        'workspace_id' => $workspace->id,
        'author_id' => $user->id,
        'title' => 'Scoped Article',
        'status' => 'published',
    ]);

    $this->actingAs($user)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->getJson(route('knowledge.articles.show', [$workspace, $article]))
        ->assertOk()
        ->assertJsonPath('article.title', 'Scoped Article');

    $this->actingAs($user)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->getJson(route('knowledge.articles.show', [$otherWorkspace, $article]))
        ->assertNotFound();
});

test('article attachments can be listed through the api', function () {
    $user = User::factory()->create();
    $workspace = createWorkspaceMember($user, 'owner');

    $article = Article::create([
        'workspace_id' => $workspace->id,
        'author_id' => $user->id,
        'title' => 'With Attachments',
        'status' => 'published',
    ]);

    $article->attachments()->create([
        'uploaded_by' => $user->id,
        'disk' => 'public',
        'file_name' => 'spec.pdf',
        'file_path' => 'knowledge/spec.pdf',
        'mime_type' => 'application/pdf',
        'file_size' => 2048,
    ]);

    $this->actingAs($user)
        ->withSession(['current_workspace_id' => $workspace->id])
        ->getJson(route('knowledge.articles.attachments.index', [$workspace, $article]))
        ->assertOk()
        ->assertJsonPath('attachments.0.file_name', 'spec.pdf');
});
