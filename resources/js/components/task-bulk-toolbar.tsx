import {
    Archive,
    Eraser,
    ListChecks,
    Tags,
    Trash2,
    UserRoundCheck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export type BulkOperation =
    | 'move_column'
    | 'assignees'
    | 'priority'
    | 'labels'
    | 'archive'
    | 'delete';

interface Props {
    selectedCount: number;
    onClear: () => void;
    onAction: (operation: BulkOperation) => void;
}

export function TaskBulkToolbar({ selectedCount, onClear, onAction }: Props) {
    const { t } = useTranslation();

    if (selectedCount === 0) {
        return null;
    }

    const actions: Array<{
        operation: BulkOperation;
        label: string;
        icon: typeof ListChecks;
        variant?: 'outline' | 'destructive';
    }> = [
        { operation: 'move_column', label: 'Move', icon: ListChecks },
        {
            operation: 'assignees',
            label: t('task.assignees'),
            icon: UserRoundCheck,
        },
        {
            operation: 'priority',
            label: t('task.priority'),
            icon: Eraser,
        },
        { operation: 'labels', label: t('task.labels'), icon: Tags },
        { operation: 'archive', label: 'Archive', icon: Archive },
        {
            operation: 'delete',
            label: t('common.delete'),
            icon: Trash2,
            variant: 'destructive',
        },
    ];

    return (
        <div className="mb-4 flex flex-col gap-3 rounded-lg border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <p className="text-sm font-medium">
                    {selectedCount}{' '}
                    {selectedCount === 1 ? 'task' : 'tasks'} selected
                </p>
                <p className="text-xs text-muted-foreground">
                    Apply a bulk action to the selected tasks.
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                {actions.map((action) => (
                    <Button
                        key={action.operation}
                        type="button"
                        variant={action.variant ?? 'outline'}
                        size="sm"
                        onClick={() => onAction(action.operation)}
                    >
                        <action.icon className="size-3.5" />
                        <span>{action.label}</span>
                    </Button>
                ))}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                >
                    Clear
                </Button>
            </div>
        </div>
    );
}
