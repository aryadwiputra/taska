<?php

namespace App\Policies\Knowledge;

use App\Models\Knowledge\Article;
use App\Models\Knowledge\ArticleAttachment;
use App\Models\User;
use App\Support\Rbac;

class ArticleAttachmentPolicy
{
    public function viewAny(User $user, Article $article): bool
    {
        return $user->can('view', $article->workspace);
    }

    public function create(User $user, Article $article): bool
    {
        return $article->author_id === $user->id || Rbac::userCanInWorkspace($user, $article->workspace, 'workspace.edit');
    }

    public function delete(User $user, ArticleAttachment $attachment): bool
    {
        $article = $attachment->article;

        return $attachment->uploaded_by === $user->id
            || $article->author_id === $user->id
            || Rbac::userCanInWorkspace($user, $article->workspace, 'workspace.edit');
    }
}
