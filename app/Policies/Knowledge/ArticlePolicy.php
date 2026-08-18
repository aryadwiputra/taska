<?php

namespace App\Policies\Knowledge;

use App\Models\Knowledge\Article;
use App\Models\User;
use App\Models\Workspace;
use App\Support\Rbac;

class ArticlePolicy
{
    public function viewAny(User $user, Workspace $workspace): bool
    {
        return $user->can('view', $workspace);
    }

    public function view(User $user, Article $article): bool
    {
        if ($article->status === 'published') {
            return $user->can('view', $article->workspace);
        }

        return $article->author_id === $user->id || Rbac::userCanInWorkspace($user, $article->workspace, 'workspace.edit');
    }

    public function create(User $user, Workspace $workspace): bool
    {
        return $user->can('view', $workspace);
    }

    public function update(User $user, Article $article): bool
    {
        return $article->author_id === $user->id || Rbac::userCanInWorkspace($user, $article->workspace, 'workspace.edit');
    }

    public function delete(User $user, Article $article): bool
    {
        return $article->author_id === $user->id || Rbac::userCanInWorkspace($user, $article->workspace, 'workspace.edit');
    }
}
