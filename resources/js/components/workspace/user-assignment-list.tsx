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
const MAX_USERS = 20;
const MAX_PROJECTS = 20;

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
    const visibleProjects = projects.slice(0, MAX_PROJECTS);

    const allSelected = users.length > 0 && selectedUsers.length === users.length;

    const getAssignment = (userId: number, projectId: number) => {
        const user = users.find((u) => u.user_id === userId);

        return user?.assignments.find((a) => a.project_id === projectId);
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b">
                        <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left">
                            <Checkbox
                                checked={allSelected}
                                onCheckedChange={(c) => onSelectAll(!!c)}
                            />
                        </th>
                        <th className="sticky left-12 z-10 bg-card px-3 py-2 text-left text-xs font-medium whitespace-nowrap">
                            {t('members.member')}
                        </th>
                        {visibleProjects.map((p) => (
                            <th
                                key={p.id}
                                className="px-3 py-2 text-center text-xs font-medium whitespace-nowrap"
                            >
                                {p.key}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.user_id} className="border-b hover:bg-muted/30">
                            <td className="sticky left-0 z-10 bg-card px-3 py-2">
                                <Checkbox
                                    checked={selectedUsers.includes(user.user_id)}
                                    onCheckedChange={(c) =>
                                        onSelectUser(user.user_id, !!c)
                                    }
                                />
                            </td>
                            <td className="sticky left-12 z-10 bg-card px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">
                                            {user.name}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {user.workspace_role}
                                        </p>
                                    </div>
                                </div>
                            </td>
                            {visibleProjects.map((project) => {
                                const assignment = getAssignment(
                                    user.user_id,
                                    project.id,
                                );

                                return (
                                    <td
                                        key={project.id}
                                        className="px-2 py-2 text-center"
                                    >
                                        {assignment ? (
                                            <Select
                                                value={assignment.role}
                                                onValueChange={(role) =>
                                                    onUpdateRole(assignment.id, role)
                                                }
                                            >
                                                <SelectTrigger className="h-8 w-[110px] text-xs">
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
                                                <SelectTrigger
                                                    className={cn(
                                                        'h-8 w-[110px] border-dashed text-xs',
                                                    )}
                                                >
                                                    <SelectValue
                                                        placeholder={t(
                                                            'assignments.assign',
                                                        )}
                                                    />
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
