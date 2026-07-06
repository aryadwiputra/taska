import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

interface UserAssignmentData {
    user_id: number;
    member_id: number;
    name: string;
    email: string;
    avatar: string | null;
    workspace_role: string;
    assignments: Array<{
        id: number;
        project_id: number;
        project_name: string;
        project_key: string;
        role: string;
    }>;
}

interface Props {
    users: UserAssignmentData[];
    projects: Array<{ id: number; name: string; key: string }>;
    selectedUsers: number[];
    onSelectUser: (userId: number, checked: boolean) => void;
    onSelectAll: (checked: boolean) => void;
    onAssign: (userId: number, projectId: number, role: string) => void;
    onUpdateRole: (assignmentId: number, role: string) => void;
    onRemove: (assignmentId: number, projectId: number, userId: number) => void;
}

const PROJECT_ROLES = ['lead', 'manager', 'developer', 'qa', 'member', 'viewer'] as const;

const ROLE_COLORS: Record<string, string> = {
    lead: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
    manager: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    developer: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    qa: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    member: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
    viewer: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
};

export function UserAssignmentList({
    users,
    projects,
    selectedUsers,
    onSelectUser,
    onSelectAll,
    onAssign,
    onUpdateRole,
    onRemove,
}: Props) {
    const { t } = useTranslation();

    if (projects.length === 0) {
        return (
            <div className="border-border bg-muted/20 flex items-center justify-center rounded-lg border py-12 text-sm text-muted-foreground">
                {t('assignments.no_projects')}
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="border-border bg-muted/20 flex items-center justify-center rounded-lg border py-12 text-sm text-muted-foreground">
                {t('assignments.no_members')}
            </div>
        );
    }

    const allSelected = users.length > 0 && selectedUsers.length === users.length;

    const getAssignment = (userId: number, projectId: number) => {
        const user = users.find((u) => u.user_id === userId);

        return user?.assignments.find((a) => a.project_id === projectId);
    };

    return (
        <div className="overflow-x-auto rounded-lg border">
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="bg-muted/50 border-b">
                        <th className="sticky left-0 z-20 border-border/60 bg-muted/50 px-3 py-2.5 text-left border-r">
                            <Checkbox
                                checked={allSelected}
                                onCheckedChange={(c) => onSelectAll(!!c)}
                            />
                        </th>
                        <th className="sticky left-12 z-20 border-border/60 bg-muted/50 px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap border-r min-w-[180px]">
                            {t('members.member')}
                        </th>
                        {projects.map((p) => (
                            <th
                                key={p.id}
                                className="border-border/60 px-2 py-2.5 font-semibold whitespace-nowrap border-r text-center last:border-r-0"
                            >
                                <div className="mx-auto flex w-[56px] items-end justify-center">
                                    <span
                                        className="-rotate-45 text-[11px] leading-none text-muted-foreground"
                                        title={p.name}
                                    >
                                        {p.key}
                                    </span>
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr
                            key={user.user_id}
                            className="border-border/60 hover:bg-muted/30 border-b last:border-b-0"
                        >
                            <td className="sticky left-0 z-10 bg-card border-border/60 px-3 py-2 border-r">
                                <Checkbox
                                    checked={selectedUsers.includes(user.user_id)}
                                    onCheckedChange={(c) =>
                                        onSelectUser(user.user_id, !!c)
                                    }
                                />
                            </td>
                            <td className="sticky left-12 z-10 min-w-[180px] bg-card border-border/60 px-4 py-2 border-r">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                            {user.name}
                                        </p>
                                        <p className="truncate text-[11px] text-muted-foreground">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>
                            </td>
                            {projects.map((project) => {
                                const assignment = getAssignment(
                                    user.user_id,
                                    project.id,
                                );

                                return (
                                    <td
                                        key={project.id}
                                        className="border-border/60 px-1.5 py-1.5 text-center border-r last:border-r-0"
                                    >
                                        {assignment ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <Select
                                                    value={assignment.role}
                                                    onValueChange={(role) =>
                                                        onUpdateRole(assignment.id, role)
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className={cn(
                                                            'h-7 w-[100px] justify-center border px-1.5 text-[10px]',
                                                            ROLE_COLORS[assignment.role] ??
                                                                'border-border',
                                                        )}
                                                    >
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {PROJECT_ROLES.map((role) => (
                                                            <SelectItem
                                                                key={role}
                                                                value={role}
                                                                className="text-xs"
                                                            >
                                                                {t(
                                                                    `members.${role}`,
                                                                )}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-5 text-muted-foreground hover:text-destructive"
                                                    onClick={() =>
                                                        onRemove(
                                                            assignment.id,
                                                            project.id,
                                                            user.user_id,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="size-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Select
                                                onValueChange={(role) =>
                                                    onAssign(
                                                        user.user_id,
                                                        project.id,
                                                        role,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="h-7 w-[100px] justify-center border-dashed border-muted-foreground/25 text-[10px] text-muted-foreground hover:border-primary/40 hover:text-foreground">
                                                    <SelectValue placeholder="+" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {PROJECT_ROLES.map((role) => (
                                                        <SelectItem
                                                            key={role}
                                                            value={role}
                                                            className="text-xs"
                                                        >
                                                            {t(
                                                                `members.${role}`,
                                                            )}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
