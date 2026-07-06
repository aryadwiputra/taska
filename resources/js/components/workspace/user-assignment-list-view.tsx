import { ChevronDown, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    onEditAssignment: (user: UserAssignmentData) => void;
    onRemove: (assignmentId: number, projectId: number, userId: number) => void;
}

export function UserAssignmentListView({
    users,
    projects,
    selectedUsers,
    onSelectUser,
    onEditAssignment,
    onRemove,
}: Props) {
    const { t } = useTranslation();
    const [expandedUsers, setExpandedUsers] = useState<Set<number>>(new Set());

    const toggleExpand = (userId: number) => {
        setExpandedUsers((prev) => {
            const next = new Set(prev);

            if (next.has(userId)) {
                next.delete(userId);
            } else {
                next.add(userId);
            }

            return next;
        });
    };

    return (
        <div className="flex flex-col gap-1">
            {users.map((user) => {
                const isExpanded = expandedUsers.has(user.user_id);

                return (
                    <div
                        key={user.user_id}
                        className="rounded-lg border"
                    >
                        <div className="flex items-center gap-3 px-4 py-3">
                            <Checkbox
                                checked={selectedUsers.includes(user.user_id)}
                                onCheckedChange={(c) =>
                                    onSelectUser(user.user_id, !!c)
                                }
                            />
                            <button
                                type="button"
                                onClick={() => toggleExpand(user.user_id)}
                                className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="size-4" />
                                ) : (
                                    <ChevronRight className="size-4" />
                                )}
                            </button>
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span className="truncate text-sm font-medium">
                                    {user.name}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {user.email}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                    {user.assignments.length}{' '}
                                    {t('assignments.projects')}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    onClick={() => onEditAssignment(user)}
                                >
                                    <Edit className="size-3.5" />
                                </Button>
                            </div>
                        </div>
                        {isExpanded && (
                            <div className="border-t px-4 py-2">
                                {user.assignments.length > 0 ? (
                                    <div className="flex flex-col gap-1">
                                        {user.assignments.map((a) => (
                                            <div
                                                key={a.id}
                                                className="flex items-center gap-3 rounded-md px-2 py-1.5"
                                            >
                                                <span className="min-w-0 flex-1 text-sm">
                                                    <span className="font-mono text-xs text-muted-foreground">
                                                        {a.project_key}
                                                    </span>{' '}
                                                    {a.project_name}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {t(`members.${a.role}`)}
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-7 text-muted-foreground hover:text-destructive"
                                                    onClick={() =>
                                                        onRemove(
                                                            a.id,
                                                            a.project_id,
                                                            user.user_id,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="py-2 text-center text-xs text-muted-foreground">
                                        {t('assignments.no_assignments')}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
