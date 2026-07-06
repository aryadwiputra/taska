import { router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useSocketEvent } from '@/hooks/use-socket';
import { UserAssignmentListView } from './user-assignment-list-view';
import { UserAssignmentHeader } from './user-assignment-header';
import { UserBulkAssignBar } from './user-bulk-assign-bar';
import { EditAssignmentDialog } from './edit-assignment-dialog';
import {
    bulkStore,
    destroy,
    index,
    store,
    update,
} from '@/routes/workspaces/user-assignments';

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

interface ProjectData {
    id: number;
    name: string;
    key: string;
}

interface Props {
    workspaceSlug: string;
    workspaceId: number;
}

export function UserAssignmentTab({ workspaceSlug, workspaceId }: Props) {
    const { t } = useTranslation();
    const [users, setUsers] = useState<UserAssignmentData[]>([]);
    const [projects, setProjects] = useState<ProjectData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterProject, setFilterProject] = useState('all');
    const [viewMode, setViewMode] = useState<'list'>('list');
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserAssignmentData | null>(null);

    const fetchData = useCallback(() => {
        const searchParams: Record<string, string> = {};

        if (search) {
            searchParams.q = search;
        }

        fetch(index.url({ workspace: workspaceSlug }, searchParams), {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        })
            .then((r) => r.json())
            .then((data) => {
                setUsers(data.users);
                setProjects(data.projects);
                setIsLoading(false);
            })
            .catch(() => {
                toast.error(t('error.unexpected_error'));
                setIsLoading(false);
            });
    }, [workspaceSlug, search, t]);

    useEffect(() => {
        const timer = setTimeout(fetchData, 200);

        return () => clearTimeout(timer);
    }, [fetchData]);

    const handleAssign = (userId: number, projectId: number, role: string) => {
        router.post(
            store({ workspace: workspaceSlug }),
            { user_id: userId, project_id: projectId, role },
            {
                onSuccess: () => {
                    fetchData();
                    toast.success(t('assignments.assigned'));
                },
            },
        );
    };

    const handleUpdateRole = (assignmentId: number, role: string) => {
        router.put(
            update({ workspace: workspaceSlug, projectMember: assignmentId }),
            { role },
            {
                onSuccess: () => fetchData(),
            },
        );
    };

    const handleRemove = (assignmentId: number, _projectId: number, _userId: number) => {
        router.delete(
            destroy({ workspace: workspaceSlug, projectMember: assignmentId }),
            {
                onSuccess: () => {
                    fetchData();
                    toast.success(t('assignments.unassigned'));
                },
                onError: (errors) => {
                    toast.error(errors.message ?? t('error.unexpected_error'));
                },
            },
        );
    };

    const handleBulkAssign = (projectIds: number[], role: string) => {
        router.post(
            bulkStore({ workspace: workspaceSlug }),
            { user_ids: selectedUsers, project_ids: projectIds, role },
            {
                onSuccess: () => {
                    setSelectedUsers([]);
                    fetchData();
                    toast.success(
                        t('assignments.bulk_success', {
                            users: selectedUsers.length,
                            projects: projectIds.length,
                        }),
                    );
                },
            },
        );
    };

    const handleSelectUser = (userId: number, checked: boolean) => {
        setSelectedUsers((prev) =>
            checked ? [...prev, userId] : prev.filter((id) => id !== userId),
        );
    };

    const filteredUsers = users.filter((user) => {
        if (filterProject === 'all') {
            return true;
        }

        if (filterProject === 'unassigned') {
            return user.assignments.length === 0;
        }

        return user.assignments.some((a) => a.project_id === Number(filterProject));
    });

    // Real-time updates
    useSocketEvent(`workspace.${workspaceId}`, 'user.assigned', () => fetchData());
    useSocketEvent(`workspace.${workspaceId}`, 'user.assignment.updated', () => fetchData());
    useSocketEvent(`workspace.${workspaceId}`, 'user.unassigned', () => fetchData());

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <UserAssignmentHeader
                search={search}
                onSearchChange={setSearch}
                filterProject={filterProject}
                onFilterChange={setFilterProject}
                projects={projects}
            />

            <UserBulkAssignBar
                selectedCount={selectedUsers.length}
                projects={projects}
                onAssign={handleBulkAssign}
                onClear={() => setSelectedUsers([])}
            />

            <UserAssignmentListView
                users={filteredUsers}
                projects={projects}
                selectedUsers={selectedUsers}
                onSelectUser={handleSelectUser}
                onEditAssignment={(user) => {
                    setEditingUser(user);
                    setEditDialogOpen(true);
                }}
                onRemove={handleRemove}
            />

            <EditAssignmentDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                user={editingUser}
                projects={projects}
                onAssign={handleAssign}
            />
        </div>
    );
}
