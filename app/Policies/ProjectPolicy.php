<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;
use App\Models\Workspace;
use App\Support\Rbac;

class ProjectPolicy
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
    public function view(User $user, Project $project): bool
    {
        return Rbac::userCanInWorkspace($user, $project->workspace, 'project.view-any')
            && ($project->visibility === 'workspace' || Rbac::canViewPrivateProject($user, $project))
            && Rbac::projectRoleAllows($user, $project, ['lead', 'manager', 'developer', 'qa', 'member', 'viewer']);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, Workspace $workspace): bool
    {
        return Rbac::userCanInWorkspace($user, $workspace, 'project.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Project $project): bool
    {
        return Rbac::userCanInWorkspace($user, $project->workspace, 'project.edit')
            && Rbac::projectRoleAllows($user, $project, ['lead', 'manager']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Project $project): bool
    {
        return Rbac::userCanInWorkspace($user, $project->workspace, 'project.delete')
            && Rbac::projectRoleAllows($user, $project, ['lead']);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Project $project): bool
    {
        return Rbac::userCanInWorkspace($user, $project->workspace, 'project.delete')
            && Rbac::projectRoleAllows($user, $project, ['lead']);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Project $project): bool
    {
        return false;
    }

    public function manageMembers(User $user, Project $project): bool
    {
        return Rbac::userCanInWorkspace($user, $project->workspace, 'project.manage-members')
            && Rbac::projectRoleAllows($user, $project, ['lead', 'manager']);
    }
}
