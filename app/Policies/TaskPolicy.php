<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Support\Rbac;

class TaskPolicy
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
    public function view(User $user, Task $task): bool
    {
        return $user->can('view', $task->project);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, Project $project): bool
    {
        return Rbac::userCanInWorkspace($user, $project->workspace, 'task.create')
            && Rbac::projectRoleAllows($user, $project, ['lead', 'manager', 'developer', 'member']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Task $task): bool
    {
        $isReporterOrAssignee = (int) $task->reporter_id === (int) $user->id
            || $task->assignees()->where('users.id', $user->id)->exists();

        return ($isReporterOrAssignee || Rbac::userCanInWorkspace($user, $task->project->workspace, 'task.edit-any'))
            && Rbac::projectRoleAllows($user, $task->project, ['lead', 'manager', 'developer', 'qa', 'member']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Task $task): bool
    {
        return Rbac::userCanInWorkspace($user, $task->project->workspace, 'task.delete-any')
            && Rbac::projectRoleAllows($user, $task->project, ['lead', 'manager']);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Task $task): bool
    {
        return $this->delete($user, $task);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Task $task): bool
    {
        return false;
    }

    public function moveColumn(User $user, Task $task): bool
    {
        return $this->update($user, $task);
    }
}
