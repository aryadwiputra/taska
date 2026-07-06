<?php

namespace App\Support;

use App\Models\Board;
use App\Models\Epic;
use App\Models\Project;
use App\Models\Sprint;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use App\Models\Workspace;

class Rbac
{
    public const WORKSPACE_ROLES = ['owner', 'admin', 'manager', 'member', 'viewer'];

    public const PROJECT_ROLES = ['lead', 'manager', 'developer', 'qa', 'member', 'viewer'];

    public static function rolePermissions(): array
    {
        return config('permissions.roles');
    }

    public static function userCanInWorkspace(User $user, Workspace $workspace, string $permission): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if (self::workspaceRole($user, $workspace) === null) {
            return false;
        }

        return $user->can($permission);
    }

    public static function projectRole(User $user, Project $project): ?string
    {
        return $project->members()
            ->where('user_id', $user->id)
            ->value('role');
    }

    /**
     * If a user has an explicit project role, that role restricts what workspace permissions allow.
     *
     * @param  list<string>  $allowedRoles
     */
    public static function projectRoleAllows(User $user, Project $project, array $allowedRoles): bool
    {
        $role = self::projectRole($user, $project);

        return $role === null || in_array($role, $allowedRoles, true);
    }

    public static function workspaceRole(User $user, Workspace $workspace): ?string
    {
        return $workspace->members()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->value('role');
    }

    public static function canManageWorkspaceProjects(User $user, Workspace $workspace): bool
    {
        return in_array(self::workspaceRole($user, $workspace), ['owner', 'admin', 'manager'], true);
    }

    public static function canViewPrivateProject(User $user, Project $project): bool
    {
        return self::canManageWorkspaceProjects($user, $project->workspace)
            || self::projectRole($user, $project) !== null;
    }

    /**
     * @param  array<int, mixed>  $arguments
     */
    public static function ownsAuthorizationWorkspace(User $user, array $arguments): bool
    {
        $workspace = self::workspaceFromArguments($arguments);

        return $workspace instanceof Workspace && (int) $workspace->owner_id === (int) $user->id;
    }

    /**
     * @param  array<int, mixed>  $arguments
     */
    public static function workspaceFromArguments(array $arguments): ?Workspace
    {
        foreach ($arguments as $argument) {
            if ($argument instanceof Workspace) {
                return $argument;
            }

            if ($argument instanceof Project) {
                return $argument->workspace;
            }

            if ($argument instanceof Board) {
                return $argument->project->workspace;
            }

            if ($argument instanceof Epic) {
                return $argument->project->workspace;
            }

            if ($argument instanceof Sprint) {
                return $argument->project->workspace;
            }

            if ($argument instanceof Task) {
                return $argument->project->workspace;
            }

            if ($argument instanceof TaskComment) {
                return $argument->task->project->workspace;
            }
        }

        $workspaceId = session('current_workspace_id');

        return $workspaceId ? Workspace::find($workspaceId) : null;
    }
}
