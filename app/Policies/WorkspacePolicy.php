<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Workspace;
use App\Support\Rbac;

class WorkspacePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Workspace $workspace): bool
    {
        return Rbac::userCanInWorkspace($user, $workspace, 'workspace.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Workspace $workspace): bool
    {
        return Rbac::userCanInWorkspace($user, $workspace, 'workspace.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Workspace $workspace): bool
    {
        return Rbac::userCanInWorkspace($user, $workspace, 'workspace.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Workspace $workspace): bool
    {
        return Rbac::userCanInWorkspace($user, $workspace, 'workspace.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Workspace $workspace): bool
    {
        return false;
    }

    public function manageMembers(User $user, Workspace $workspace): bool
    {
        return Rbac::userCanInWorkspace($user, $workspace, 'workspace.manage-members');
    }
}
