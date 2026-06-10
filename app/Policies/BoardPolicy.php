<?php

namespace App\Policies;

use App\Models\Board;
use App\Models\Project;
use App\Models\User;
use App\Support\Rbac;

class BoardPolicy
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
    public function view(User $user, Board $board): bool
    {
        return $user->can('view', $board->project);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, Project $project): bool
    {
        return Rbac::userCanInWorkspace($user, $project->workspace, 'board.manage')
            && Rbac::projectRoleAllows($user, $project, ['lead', 'manager']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Board $board): bool
    {
        return Rbac::userCanInWorkspace($user, $board->project->workspace, 'board.manage')
            && Rbac::projectRoleAllows($user, $board->project, ['lead', 'manager']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Board $board): bool
    {
        return $this->update($user, $board);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Board $board): bool
    {
        return $this->update($user, $board);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Board $board): bool
    {
        return false;
    }
}
