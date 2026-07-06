import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Props {
    selectedCount: number;
    projects: Array<{ id: number; name: string; key: string }>;
    onAssign: (projectIds: number[], role: string) => void;
    onClear: () => void;
}

const PROJECT_ROLES = ['lead', 'manager', 'developer', 'qa', 'member', 'viewer'] as const;

export function UserBulkAssignBar({
    selectedCount,
    projects,
    onAssign,
    onClear,
}: Props) {
    const { t } = useTranslation();
    const [role, setRole] = useState<string>('');
    const [targetProject, setTargetProject] = useState<string>('');

    const handleApply = () => {
        if (!role || !targetProject) {
            return;
        }

        const projectIds =
            targetProject === '__all__'
                ? projects.map((p) => p.id)
                : [Number(targetProject)];

        onAssign(projectIds, role);
        setRole('');
        setTargetProject('');
    };

    if (selectedCount === 0) {
        return null;
    }

    return (
        <div className="sticky top-0 z-20 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
            <span className="text-sm font-medium">
                {t('assignments.bulk_selected', { count: selectedCount })}
            </span>
            <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-8 w-[130px] text-xs">
                    <SelectValue placeholder={t('members.role')} />
                </SelectTrigger>
                <SelectContent>
                    {PROJECT_ROLES.map((r) => (
                        <SelectItem key={r} value={r} className="text-xs">
                            {t(`members.${r}`)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={targetProject} onValueChange={setTargetProject}>
                <SelectTrigger className="h-8 w-[160px] text-xs">
                    <SelectValue placeholder={t('assignments.select_project')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="__all__" className="text-xs">
                        {t('assignments.all_projects')}
                    </SelectItem>
                    {projects.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                            {p.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button
                size="sm"
                onClick={handleApply}
                disabled={!role || !targetProject}
            >
                {t('assignments.bulk_assign')}
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="text-muted-foreground"
            >
                {t('common.cancel')}
            </Button>
        </div>
    );
}
