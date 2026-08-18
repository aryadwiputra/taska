<?php

namespace App\Policies\Knowledge;

use App\Models\Knowledge\Category;
use App\Models\User;
use App\Models\Workspace;
use App\Support\Rbac;

class CategoryPolicy
{
    public function viewAny(User $user, Workspace $workspace): bool
    {
        return $user->can('view', $workspace);
    }

    public function create(User $user, Workspace $workspace): bool
    {
        return Rbac::userCanInWorkspace($user, $workspace, 'workspace.edit');
    }

    public function update(User $user, Category $category): bool
    {
        return Rbac::userCanInWorkspace($user, $category->workspace, 'workspace.edit');
    }

    public function delete(User $user, Category $category): bool
    {
        return Rbac::userCanInWorkspace($user, $category->workspace, 'workspace.edit');
    }
}
