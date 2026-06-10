<?php

namespace App\Support;

use App\Models\Board;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class Rbac
{
    public const WORKSPACE_ROLES = ['owner', 'admin', 'manager', 'member', 'viewer'];

    public const PROJECT_ROLES = ['lead', 'manager', 'developer', 'qa', 'member', 'viewer'];

    public const PERMISSIONS = [
        'workspace.view',
        'workspace.edit',
        'workspace.delete',
        'workspace.manage-members',
        'workspace.manage-labels',
        'workspace.manage-task-types',
        'workspace.manage-priorities',
        'project.create',
        'project.view-any',
        'project.edit',
        'project.delete',
        'project.manage-members',
        'task.create',
        'task.edit-any',
        'task.delete-any',
        'task.comment',
        'task.delete-comment-any',
        'epic.create',
        'epic.edit',
        'epic.delete',
        'sprint.create',
        'sprint.edit',
        'sprint.delete',
        'board.manage',
    ];

    /**
     * @return array<string, list<string>>
     */
    public static function rolePermissions(): array
    {
        return [
            'owner' => self::PERMISSIONS,
            'admin' => array_values(array_diff(self::PERMISSIONS, ['workspace.delete'])),
            'manager' => [
                'workspace.view',
                'workspace.manage-labels',
                'workspace.manage-task-types',
                'workspace.manage-priorities',
                'project.create',
                'project.view-any',
                'project.edit',
                'project.manage-members',
                'task.create',
                'task.edit-any',
                'task.delete-any',
                'task.comment',
                'task.delete-comment-any',
                'epic.create',
                'epic.edit',
                'epic.delete',
                'sprint.create',
                'sprint.edit',
                'sprint.delete',
                'board.manage',
            ],
            'member' => [
                'workspace.view',
                'project.view-any',
                'task.create',
                'task.comment',
            ],
            'viewer' => [
                'workspace.view',
                'project.view-any',
            ],
        ];
    }

    public static function ensureWorkspaceRoles(Workspace $workspace): void
    {
        DB::transaction(function () use ($workspace): void {
            $previousTeamId = getPermissionsTeamId();

            setPermissionsTeamId($workspace->id);

            $permissions = collect(self::PERMISSIONS)
                ->map(fn (string $permission): Permission => Permission::firstOrCreate([
                    'name' => $permission,
                    'guard_name' => 'web',
                ]));

            foreach (self::rolePermissions() as $roleName => $permissionNames) {
                $role = Role::firstOrCreate([
                    'name' => $roleName,
                    'guard_name' => 'web',
                    'workspace_id' => $workspace->id,
                ]);

                $role->syncPermissions($permissions->whereIn('name', $permissionNames));
            }

            app(PermissionRegistrar::class)->forgetCachedPermissions();
            setPermissionsTeamId($previousTeamId);
        });
    }

    public static function syncWorkspaceRole(User $user, Workspace $workspace, string $role): void
    {
        $previousTeamId = getPermissionsTeamId();

        setPermissionsTeamId($workspace->id);
        $user->unsetRelation('roles')->unsetRelation('permissions');
        $user->syncRoles([$role]);
        $user->unsetRelation('roles')->unsetRelation('permissions');

        setPermissionsTeamId($previousTeamId);
    }

    public static function removeWorkspaceRoles(User $user, Workspace $workspace): void
    {
        $previousTeamId = getPermissionsTeamId();

        setPermissionsTeamId($workspace->id);
        $user->unsetRelation('roles')->unsetRelation('permissions');
        $user->syncRoles([]);
        $user->unsetRelation('roles')->unsetRelation('permissions');

        setPermissionsTeamId($previousTeamId);
    }

    public static function workspaceRole(User $user, Workspace $workspace): ?string
    {
        return $workspace->members()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->value('role');
    }

    public static function userCanInWorkspace(User $user, Workspace $workspace, string $permission): bool
    {
        if (self::workspaceRole($user, $workspace) === null) {
            return false;
        }

        $previousTeamId = getPermissionsTeamId();

        setPermissionsTeamId($workspace->id);
        $user->unsetRelation('roles')->unsetRelation('permissions');

        $allowed = $user->can($permission);

        $user->unsetRelation('roles')->unsetRelation('permissions');
        setPermissionsTeamId($previousTeamId);

        return $allowed;
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
