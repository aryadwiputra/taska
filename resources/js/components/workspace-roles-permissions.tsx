import { Check, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    rolesPermissions: Record<string, string | string[]>;
    permissionLabels: Record<string, string>;
    roleLabels: Record<string, string>;
}

const PERMISSION_ORDER = [
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

export function WorkspaceRolesPermissions({
    rolesPermissions,
    permissionLabels,
    roleLabels,
}: Props) {
    const roleOrder = ['owner', 'admin', 'manager', 'member', 'viewer'];

    return (
        <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {roleOrder.map((roleKey) => {
                    const permissions = rolesPermissions[roleKey];
                    const isWildcard =
                        Array.isArray(permissions) &&
                        permissions.length === 1 &&
                        permissions[0] === '*';

                    return (
                        <Card key={roleKey}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base capitalize">
                                        {roleLabels[roleKey] ?? roleKey}
                                    </CardTitle>
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        {isWildcard
                                            ? 'All'
                                            : Array.isArray(permissions)
                                              ? `${permissions.length}`
                                              : '0'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-1.5">
                                {isWildcard ? (
                                    <div className="flex items-center gap-2 rounded-md bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
                                        <Shield className="size-4 text-primary" />
                                        <span>
                                            Full access — owner bypass semua
                                            permission check
                                        </span>
                                    </div>
                                ) : Array.isArray(permissions) ? (
                                    PERMISSION_ORDER.filter((p) =>
                                        permissions.includes(p),
                                    ).map((perm) => (
                                        <div
                                            key={perm}
                                            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm"
                                        >
                                            <Check className="size-3.5 shrink-0 text-emerald-500" />
                                            <span>
                                                {permissionLabels[perm] ?? perm}
                                            </span>
                                        </div>
                                    ))
                                ) : null}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        Project Role Policies
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-sm text-muted-foreground">
                        Project roles can grant additional access beyond
                        workspace permissions. These policies apply when a user
                        has an explicit project role.
                    </p>
                    <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="px-4 py-2.5 text-left font-medium">
                                        Action
                                    </th>
                                    <th className="px-3 py-2.5 text-center font-medium">
                                        lead
                                    </th>
                                    <th className="px-3 py-2.5 text-center font-medium">
                                        manager
                                    </th>
                                    <th className="px-3 py-2.5 text-center font-medium">
                                        developer
                                    </th>
                                    <th className="px-3 py-2.5 text-center font-medium">
                                        qa
                                    </th>
                                    <th className="px-3 py-2.5 text-center font-medium">
                                        member
                                    </th>
                                    <th className="px-3 py-2.5 text-center font-medium">
                                        viewer
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    {
                                        action: 'Edit task (reporter/assignee always can)',
                                        allowed: [
                                            'lead',
                                            'manager',
                                            'developer',
                                        ],
                                        note: 'TaskPolicy::update',
                                    },
                                    {
                                        action: 'Delete task',
                                        allowed: ['lead', 'manager'],
                                        note: 'TaskPolicy::delete',
                                    },
                                    {
                                        action: 'Manage board (columns, reorder)',
                                        allowed: ['lead', 'manager'],
                                        note: 'BoardPolicy::update',
                                    },
                                ].map((row) => (
                                    <tr
                                        key={row.action}
                                        className="border-b last:border-0"
                                    >
                                        <td className="px-4 py-2.5">
                                            <span>{row.action}</span>
                                            <span className="ml-2 font-mono text-xs text-muted-foreground">
                                                {row.note}
                                            </span>
                                        </td>
                                        {[
                                            'lead',
                                            'manager',
                                            'developer',
                                            'qa',
                                            'member',
                                            'viewer',
                                        ].map((role) => (
                                            <td
                                                key={role}
                                                className="px-3 py-2.5 text-center"
                                            >
                                                {row.allowed.includes(role) ? (
                                                    <Check className="mx-auto size-4 text-emerald-500" />
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
