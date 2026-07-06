import { usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import type { Permission, ProjectRole, WorkspaceRole } from '@/types/permissions';

export function canAccessWorkspaceSettings(role?: WorkspaceRole): boolean {
    return role === 'owner' || role === 'admin';
}

export function canCreateProject(role?: WorkspaceRole): boolean {
    return role === 'owner' || role === 'admin' || role === 'manager';
}

export function canAccessProjectSettings(role?: ProjectRole | null): boolean {
    return role === 'lead' || role === 'manager';
}

export function canAccessGoals(role?: WorkspaceRole): boolean {
    return role === 'owner' || role === 'admin' || role === 'manager';
}

export function canEditTask(
    wsRole?: WorkspaceRole,
    projectRole?: ProjectRole | null,
): boolean {
    return (
        (wsRole === 'owner' || wsRole === 'admin' || wsRole === 'manager') &&
        (projectRole === null ||
            projectRole === 'lead' ||
            projectRole === 'manager' ||
            projectRole === 'developer')
    );
}

export function canDeleteTask(
    wsRole?: WorkspaceRole,
    projectRole?: ProjectRole | null,
): boolean {
    return wsRole === 'owner' || projectRole === 'lead';
}

export function canComment(
    wsRole?: WorkspaceRole,
    projectRole?: ProjectRole | null,
): boolean {
    return (
        (wsRole === 'owner' ||
            wsRole === 'admin' ||
            wsRole === 'manager' ||
            wsRole === 'member') &&
        (projectRole === null ||
            projectRole === 'lead' ||
            projectRole === 'manager' ||
            projectRole === 'developer' ||
            projectRole === 'qa' ||
            projectRole === 'member')
    );
}

export function canCreateTask(wsRole?: WorkspaceRole): boolean {
    return (
        wsRole === 'owner' ||
        wsRole === 'admin' ||
        wsRole === 'manager' ||
        wsRole === 'member'
    );
}

export function canManageEpics(wsRole?: WorkspaceRole): boolean {
    return wsRole === 'owner' || wsRole === 'admin' || wsRole === 'manager';
}

export const canManageSprints = canManageEpics;

export function canManageLabels(
    wsRole?: WorkspaceRole,
    projectRole?: ProjectRole | null,
): boolean {
    return (
        (wsRole === 'owner' || wsRole === 'admin' || wsRole === 'manager') &&
        (projectRole === null || projectRole === 'lead' || projectRole === 'manager')
    );
}

export const canManageBoard = canManageLabels;

export function canDeleteProject(
    wsRole?: WorkspaceRole,
    projectRole?: ProjectRole | null,
): boolean {
    return wsRole === 'owner' || projectRole === 'lead';
}

export function canDeleteWorkspace(role?: WorkspaceRole): boolean {
    return role === 'owner';
}

export function toastNoAccess(): void {
    toast.error("You don't have permission to access this feature.");
}

export function useHasPermission() {
    const { props } = usePage();
    const permissions = props.permissions as {
        workspace?: string[];
        project?: string[];
    } | undefined;

    return (permission: Permission): boolean =>
        Boolean(
            permissions?.workspace?.includes(permission) ||
            permissions?.project?.includes(permission),
        );
}
