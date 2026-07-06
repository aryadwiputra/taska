import { router } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: UserAssignmentData | null;
    projects: Array<{ id: number; name: string; key: string }>;
    onAssign: (userId: number, projectId: number, role: string) => void;
}

const PROJECT_ROLES = ['lead', 'manager', 'developer', 'qa', 'member', 'viewer'] as const;

export function EditAssignmentDialog({
    open,
    onOpenChange,
    user,
    projects,
    onAssign,
}: Props) {
    const { t } = useTranslation();
    const [projectId, setProjectId] = useState('');
    const [role, setRole] = useState('');

    if (!user) {
        return null;
    }

    const assignedProjectIds = new Set(user.assignments.map((a) => a.project_id));
    const availableProjects = projects.filter(
        (p) => !assignedProjectIds.has(p.id),
    );

    const handleAdd = () => {
        if (!projectId || !role) {
            return;
        }

        onAssign(user.user_id, Number(projectId), role);
        setProjectId('');
        setRole('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {t('assignments.edit_title', { name: user.name })}
                    </DialogTitle>
                    <DialogDescription>
                        {t('assignments.edit_description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <p className="text-sm font-medium">
                            {t('assignments.current_assignments')}
                        </p>
                        {user.assignments.length > 0 ? (
                            <div className="flex flex-col gap-1 rounded-md border p-2">
                                {user.assignments.map((a) => (
                                    <div
                                        key={a.id}
                                        className="flex items-center justify-between rounded px-2 py-1 text-sm"
                                    >
                                        <span>
                                            {a.project_name}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {t(`members.${a.role}`)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                {t('assignments.no_assignments')}
                            </p>
                        )}
                    </div>

                    {availableProjects.length > 0 && (
                        <div className="flex flex-col gap-3 rounded-md border p-3">
                            <p className="text-sm font-medium">
                                {t('assignments.add_assignment')}
                            </p>
                            <Select
                                value={projectId}
                                onValueChange={setProjectId}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={t(
                                            'assignments.select_project',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableProjects.map((p) => (
                                        <SelectItem
                                            key={p.id}
                                            value={String(p.id)}
                                        >
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={t('members.role')}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROJECT_ROLES.map((r) => (
                                        <SelectItem key={r} value={r}>
                                            {t(`members.${r}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                size="sm"
                                onClick={handleAdd}
                                disabled={!projectId || !role}
                            >
                                {t('common.add')}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
