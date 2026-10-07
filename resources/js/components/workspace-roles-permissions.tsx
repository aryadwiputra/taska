import { usePage } from '@inertiajs/react';
import { Check, Search } from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Props {
    rolesPermissions: Record<string, string | string[]>;
    permissionLabels: Record<string, string>;
    roleLabels: Record<string, string>;
}

const ROLE_ORDER = ['owner', 'admin', 'manager', 'member', 'viewer', 'guest'] as const;

const PERMISSION_GROUPS: Array<{ key: string; permissions: string[] }> = [
    {
        key: 'workspace',
        permissions: [
            'workspace.view',
            'workspace.edit',
            'workspace.delete',
            'workspace.manage-members',
            'workspace.manage-labels',
            'workspace.manage-task-types',
            'workspace.manage-priorities',
        ],
    },
    {
        key: 'project',
        permissions: [
            'project.create',
            'project.view-any',
            'project.edit',
            'project.delete',
            'project.manage-members',
        ],
    },
    {
        key: 'task',
        permissions: [
            'task.create',
            'task.edit-any',
            'task.edit-own',
            'task.assign',
            'task.view-own',
            'task.delete-any',
            'task.comment',
            'task.comment-own',
            'task.delete-comment-any',
        ],
    },
    {
        key: 'epic',
        permissions: ['epic.create', 'epic.edit', 'epic.delete'],
    },
    {
        key: 'sprint',
        permissions: ['sprint.create', 'sprint.edit', 'sprint.delete'],
    },
    {
        key: 'board',
        permissions: ['board.manage'],
    },
];

export function WorkspaceRolesPermissions({
    rolesPermissions,
    permissionLabels,
    roleLabels,
}: Props) {
    const { t } = useTranslation();
    const { props } = usePage();
    const currentRole = (
        props.currentWorkspace as { role?: string } | null | undefined
    )?.role;

    const [query, setQuery] = useState('');

    const grants = (role: string, permission: string): boolean => {
        const permissions = rolesPermissions[role];

        if (!Array.isArray(permissions)) {
            return false;
        }

        if (permissions.length === 1 && permissions[0] === '*') {
            return true;
        }

        return permissions.includes(permission);
    };

    const groups = useMemo(() => {
        const term = query.trim().toLowerCase();

        if (term === '') {
            return PERMISSION_GROUPS;
        }

        return PERMISSION_GROUPS.map((group) => ({
            ...group,
            permissions: group.permissions.filter((permission) => {
                const label = (
                    permissionLabels[permission] ?? permission
                ).toLowerCase();
                const groupLabel = t(`roles.groups.${group.key}`).toLowerCase();

                return (
                    label.includes(term) ||
                    permission.toLowerCase().includes(term) ||
                    groupLabel.includes(term)
                );
            }),
        })).filter((group) => group.permissions.length > 0);
    }, [query, permissionLabels, t]);

    const columnCount = ROLE_ORDER.length + 1;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={t('roles.search_placeholder')}
                        aria-label={t('roles.search_placeholder')}
                        className="pl-8"
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    {t('roles.owner_note')}
                </p>
            </div>

            <div className="overflow-x-auto rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-2/5">
                                {t('roles.column_permission')}
                            </TableHead>
                            {ROLE_ORDER.map((role) => (
                                <TableHead
                                    key={role}
                                    className={cn(
                                        'text-center',
                                        role === currentRole &&
                                            'bg-canvas-soft',
                                    )}
                                >
                                    <span className="inline-flex flex-col items-center gap-1">
                                        <span className="font-medium">
                                            {roleLabels[role] ?? role}
                                        </span>
                                        {role === currentRole && (
                                            <Badge
                                                variant="secondary"
                                                className="px-1.5 py-0 text-[10px] leading-4"
                                            >
                                                {t('roles.you')}
                                            </Badge>
                                        )}
                                    </span>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {groups.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell
                                    colSpan={columnCount}
                                    className="py-10 text-center text-sm text-muted-foreground"
                                >
                                    {t('roles.no_results', { query })}
                                </TableCell>
                            </TableRow>
                        ) : (
                            groups.map((group) => (
                                <Fragment key={group.key}>
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell
                                            colSpan={columnCount}
                                            className="bg-muted/40 py-2 text-xs font-medium text-muted-foreground"
                                        >
                                            {t(`roles.groups.${group.key}`)}
                                        </TableCell>
                                    </TableRow>
                                    {group.permissions.map((permission) => (
                                        <TableRow key={permission}>
                                            <TableCell className="py-2">
                                                {permissionLabels[permission] ??
                                                    permission}
                                            </TableCell>
                                            {ROLE_ORDER.map((role) => (
                                                <TableCell
                                                    key={role}
                                                    className={cn(
                                                        'text-center',
                                                        role === currentRole &&
                                                            'bg-canvas-soft',
                                                    )}
                                                >
                                                    {grants(
                                                        role,
                                                        permission,
                                                    ) ? (
                                                        <Check
                                                            aria-label={t(
                                                                'roles.granted',
                                                            )}
                                                            className="mx-auto size-4 text-sticker-green"
                                                        />
                                                    ) : (
                                                        <span
                                                            aria-label={t(
                                                                'roles.not_granted',
                                                            )}
                                                            className="text-ink-faint"
                                                        >
                                                            —
                                                        </span>
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </Fragment>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
