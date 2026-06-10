<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use App\Support\Rbac;

class TaskCommentPolicy
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
    public function view(User $user, TaskComment $taskComment): bool
    {
        return $user->can('view', $taskComment->task);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, Task $task): bool
    {
        return Rbac::userCanInWorkspace($user, $task->project->workspace, 'task.comment')
            && Rbac::projectRoleAllows($user, $task->project, ['lead', 'manager', 'developer', 'qa', 'member']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, TaskComment $taskComment): bool
    {
        return (int) $taskComment->user_id === (int) $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, TaskComment $taskComment): bool
    {
        return (int) $taskComment->user_id === (int) $user->id
            || (Rbac::userCanInWorkspace($user, $taskComment->task->project->workspace, 'task.delete-comment-any')
                && Rbac::projectRoleAllows($user, $taskComment->task->project, ['lead', 'manager']));
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, TaskComment $taskComment): bool
    {
        return $this->delete($user, $taskComment);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, TaskComment $taskComment): bool
    {
        return false;
    }
}
