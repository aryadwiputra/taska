<?php

namespace App\Services;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class WorkspaceRoleService
{
    public function ensureRoles(Workspace $workspace): void
    {
        DB::transaction(function () use ($workspace): void {
            $previousTeamId = getPermissionsTeamId();

            setPermissionsTeamId($workspace->id);

            $permissionNames = config('permissions.permissions');

            $permissions = collect($permissionNames)
                ->map(fn (string $permission): Permission => Permission::firstOrCreate([
                    'name' => $permission,
                    'guard_name' => 'web',
                ]));

            foreach (config('permissions.roles') as $roleName => $rolePermissionNames) {
                $role = Role::firstOrCreate([
                    'name' => $roleName,
                    'guard_name' => 'web',
                    'workspace_id' => $workspace->id,
                ]);

                if ($rolePermissionNames === ['*']) {
                    $role->syncPermissions($permissions);

                    continue;
                }

                $role->syncPermissions($permissions->whereIn('name', $rolePermissionNames));
            }

            app(PermissionRegistrar::class)->forgetCachedPermissions();
            setPermissionsTeamId($previousTeamId);
        });
    }

    public function syncRole(User $user, Workspace $workspace, string $role): void
    {
        $previousTeamId = getPermissionsTeamId();

        setPermissionsTeamId($workspace->id);
        $user->unsetRelation('roles')->unsetRelation('permissions');
        $user->syncRoles([$role]);
        $user->unsetRelation('roles')->unsetRelation('permissions');

        setPermissionsTeamId($previousTeamId);
    }

    public function removeRoles(User $user, Workspace $workspace): void
    {
        $previousTeamId = getPermissionsTeamId();

        setPermissionsTeamId($workspace->id);
        $user->unsetRelation('roles')->unsetRelation('permissions');
        $user->syncRoles([]);
        $user->unsetRelation('roles')->unsetRelation('permissions');

        setPermissionsTeamId($previousTeamId);
    }
}
